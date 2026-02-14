import { Hono } from 'hono';
import { z } from 'zod/v4';
import { db, table } from '../db';
import buildConflictUpdateColumns from '../util/buildConflictUpdateColumns';
import { and, asc, eq, gt } from 'drizzle-orm/sqlite-core/expressions';
import { HTTPException } from 'hono/http-exception';
import type { WebSocketBroadcastServer } from '../broadcast_server';
import { waitUntil } from 'cloudflare:workers';

const router = new Hono<{ Bindings: Env }>();

const maxSchema = z.coerce.number().min(1).max(100).default(100);
const updatedAfterSchema = z.coerce.number().min(0).default(0);
const tripIdSchema = z.coerce
	.number()
	.min(0)
	.max(2 ** 31);
router.get('/:tripId', (c) => {
	const tripId = tripIdSchema.parse(c.req.param('tripId'));
	const max = maxSchema.parse(c.req.query('max'));
	const updatedAfter = updatedAfterSchema.parse(c.req.query('updatedAfter'));
	const telemetry = db.query.telemetryTable.findMany({
		limit: max,
		orderBy: asc(table.telemetryTable.editedAt),
		where: and(eq(table.telemetryTable.tripId, tripId), gt(table.telemetryTable.editedAt, updatedAfter)),
	});
	return c.json(telemetry);
});

router.get('/:tripId/ws', (c) => {
	const tripId = tripIdSchema.parse(c.req.param('tripId'));
	if (c.req.header('Upgrade') !== 'websocket') throw new HTTPException(426, { message: 'Expected Upgrade: websocket' });

	const stub = c.env.BROADCAST_SERVER.getByName('trip_' + tripId);

	return stub.fetch(c.req.raw);
});

const telemetrySchema = z
	.array(
		z.strictObject({
			id: z.int().min(-9_007_199_254_740_991).max(9_007_199_254_740_991),
			tripId: z.int().min(-9_007_199_254_740_991).max(9_007_199_254_740_991),
			time: z.int().min(-9_007_199_254_740_991).max(9_007_199_254_740_991),
			// data values
			tempMosfet: z.number().min(-140_737_488_355_328).max(140_737_488_355_327).optional(),
			tempMotor: z.number().min(-140_737_488_355_328).max(140_737_488_355_327).optional(),
			motorCurrent: z.number().min(-140_737_488_355_328).max(140_737_488_355_327).optional(),
			inputCurrent: z.number().min(-140_737_488_355_328).max(140_737_488_355_327).optional(),
			dutyCycle: z.number().min(-140_737_488_355_328).max(140_737_488_355_327).optional(),
			tacho: z.number().min(-140_737_488_355_328).max(140_737_488_355_327).optional(),
			rpm: z.number().min(-140_737_488_355_328).max(140_737_488_355_327).optional(),
			volts: z.number().min(-140_737_488_355_328).max(140_737_488_355_327).optional(),
			wattHours: z.number().min(-140_737_488_355_328).max(140_737_488_355_327).optional(),
			error: z.int().min(-9_007_199_254_740_991).max(9_007_199_254_740_991).optional(),
			// phone values
			lat: z.number().min(-140_737_488_355_328).max(140_737_488_355_327).optional(),
			long: z.number().min(-140_737_488_355_328).max(140_737_488_355_327).optional(),
			heading: z.number().min(-140_737_488_355_328).max(140_737_488_355_327).optional(),
		})
	)
	.min(1)
	.max(100);
const telemetrySetter = buildConflictUpdateColumns(table.tripsTable);
router.post('/', async (c) => {
	const telemetry = telemetrySchema.parse(c.req.json()).map((telemetry) => ({ ...telemetry, editedAt: Date.now() }));
	await db.insert(table.telemetryTable).values(telemetry).onConflictDoUpdate({
		target: table.tripsTable.id,
		set: telemetrySetter,
	});

	// Broadcast all the changes to the respective
	const map = new Map<number, object[]>();
	telemetry.forEach((row) => (map.has(row.tripId) ? map.get(row.tripId)!.push(row) : map.set(row.tripId, [row])));
	for (const [key, val] of map.entries()) {
		const stub = c.env.BROADCAST_SERVER.getByName('trip_' + key) as DurableObjectStub<WebSocketBroadcastServer>;
		waitUntil(stub.broadcastMessage(val)); // Return from the function as fast as possible and worry about broadcast later
	}

	return c.json({}, 200);
});

export default router;

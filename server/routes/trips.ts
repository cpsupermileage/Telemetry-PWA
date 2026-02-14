import { Hono } from 'hono';
import { z } from 'zod/v4';
import { db, table } from '../db';
import buildConflictUpdateColumns from '../util/buildConflictUpdateColumns';
import { asc, gt } from 'drizzle-orm/sqlite-core/expressions';
import type { WebSocketBroadcastServer } from '../broadcast_server';
import { HTTPException } from 'hono/http-exception';
import { waitUntil } from 'cloudflare:workers';

const router = new Hono<{ Bindings: Env }>();

const maxSchema = z.coerce.number().min(1).max(100).default(100);
const updatedAfterSchema = z.coerce.number().min(0).default(0);
router.get('/', (c) => {
	const max = maxSchema.parse(c.req.query('max'));
	const updatedAfter = updatedAfterSchema.parse(c.req.query('updatedAfter'));
	const trips = db.query.tripsTable.findMany({
		limit: max,
		orderBy: asc(table.tripsTable.editedAt),
		where: gt(table.tripsTable.editedAt, updatedAfter),
	});
	return c.json(trips);
});

router.get('/ws', (c) => {
	if (c.req.header('Upgrade') !== 'websocket') throw new HTTPException(426, { message: 'Expected Upgrade: websocket' });

	const stub = c.env.BROADCAST_SERVER.getByName('trips');

	return stub.fetch(c.req.raw);
});

const tripSchema = z
	.array(
		z.strictObject({
			id: z.int().min(-9_007_199_254_740_991).max(9_007_199_254_740_991),
			name: z.string().min(1).max(512),
			type: z.int().min(-9_007_199_254_740_991).max(9_007_199_254_740_991),
			createdAt: z.int().min(-9_007_199_254_740_991).max(9_007_199_254_740_991),
			startedAt: z.int().min(-9_007_199_254_740_991).max(9_007_199_254_740_991).optional(),
			endedAt: z.int().min(-9_007_199_254_740_991).max(9_007_199_254_740_991).optional(),
		})
	)
	.min(1)
	.max(100);
const tripSetter = buildConflictUpdateColumns(table.tripsTable);
router.post('/', async (c) => {
	const trips = tripSchema.parse(c.req.json()).map((trip) => ({ ...trip, editedAt: Date.now() }));
	await db.insert(table.tripsTable).values(trips).onConflictDoUpdate({
		target: table.tripsTable.id,
		set: tripSetter,
	});

	// Global durable object for the trips
	const stub = c.env.BROADCAST_SERVER.getByName('trips') as DurableObjectStub<WebSocketBroadcastServer>;
	waitUntil(stub.broadcastMessage(trips));

	return c.json({}, 200);
});

export default router;

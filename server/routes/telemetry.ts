import { Hono } from 'hono';
import { z } from 'zod/v4';
import { HTTPException } from 'hono/http-exception';
import type { TelemetryDataServer } from '../TelemetryDataServer';
import { telemetrySchema } from '../validation/telemetry';

const router = new Hono<{ Bindings: Env }>();

const maxSchema = z.coerce.number().min(1).max(100).default(100);
const updatedAfterSchema = z.coerce.number().min(0).default(0);
const tripIdSchema = z.coerce
	.number()
	.min(0)
	.max(2 ** 31);
router.get('/:tripId', async (c) => {
	const tripId = tripIdSchema.parse(c.req.param('tripId'));
	const max = maxSchema.parse(c.req.query('max'));
	const updatedAfter = updatedAfterSchema.parse(c.req.query('updatedAfter'));
	const stub = c.env.TELEMETRY_DATA_SERVER.getByName(tripId + '') as DurableObjectStub<TelemetryDataServer>;
	const telemetry = await stub.select(max, updatedAfter);
	return c.json(telemetry);
});

router.get('/:tripId/ws', (c) => {
	const tripId = tripIdSchema.parse(c.req.param('tripId'));
	if (c.req.header('Upgrade') !== 'websocket') throw new HTTPException(426, { message: 'Expected Upgrade: websocket' });

	const stub = c.env.TELEMETRY_DATA_SERVER.getByName(tripId + '') as DurableObjectStub<TelemetryDataServer>;

	return stub.fetch(c.req.raw);
});

router.post('/:tripId', (c) => {
	const tripId = tripIdSchema.parse(c.req.param('tripId'));
	const data = telemetrySchema.parse(c.req.json());

	const stub = c.env.TELEMETRY_DATA_SERVER.getByName(tripId + '') as DurableObjectStub<TelemetryDataServer>;
	const rows = stub.upload(data);
	return c.json(rows);
});

export default router;

import { Hono } from 'hono';
import { z } from 'zod/v4';
import type { TripsDataServer } from '../TripsDataServer';
import { HTTPException } from 'hono/http-exception';
import { tripSchema } from '../validation/trips';

const router = new Hono<{ Bindings: Env }>();

const maxSchema = z.coerce.number().min(1).max(100).default(100);
const updatedAfterSchema = z.coerce.number().min(0).default(0);
router.get('/', async (c) => {
	const max = maxSchema.parse(c.req.query('max'));
	const updatedAfter = updatedAfterSchema.parse(c.req.query('updatedAfter'));
	const stub = c.env.TRIPS_DATA_SERVER.getByName('global') as DurableObjectStub<TripsDataServer>;
	const trips = await stub.select(max, updatedAfter);
	return c.json(trips);
});

router.get('/ws', (c) => {
	if (c.req.header('Upgrade') !== 'websocket') throw new HTTPException(426, { message: 'Expected Upgrade: websocket' });

	const stub = c.env.TRIPS_DATA_SERVER.getByName('global') as DurableObjectStub<TripsDataServer>;

	return stub.fetch(c.req.raw);
});

router.post('/', (c) => {
	const data = tripSchema.parse(c.req.json());

	const stub = c.env.TRIPS_DATA_SERVER.getByName('global') as DurableObjectStub<TripsDataServer>;
	const rows = stub.upload(data);
	return c.json(rows);
});

export default router;

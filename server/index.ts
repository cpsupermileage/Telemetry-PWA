import { Hono } from 'hono';
import { ZodError } from 'zod';
import trips from './routes/trips';
import telemetry from './routes/telemetry';

export * from './TripsDataServer';
export * from './TelemetryDataServer';

const app = new Hono<{ Bindings: Env }>().basePath('/api');

app.route('/trips', trips);
app.route('/telemetry', telemetry);

app.onError((err, c) => {
	if (err instanceof ZodError) {
		return c.json({ message: err.issues[0].path.join('.') + ': ' + err.issues[0].message }, 403);
	} else {
		console.error(err);
		return c.json({ message: 'Internal Error' }, 500);
	}
});

export default app;

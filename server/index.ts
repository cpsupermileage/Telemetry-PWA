import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';
import trips from './routes/trips';
import telemetry from './routes/telemetry';

const app = new Hono<{ Bindings: Env }>().basePath('/api');

app.route('/trips', trips);
app.route('/telemetry', telemetry);

app.onError((err) => {
	if (err instanceof ZodError) {
		throw new HTTPException(403, { message: err.issues[0].path.join('.') + ': ' + err.issues[0].message });
	} else throw err;
});

export default app;

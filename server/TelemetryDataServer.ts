import { DurableObject } from 'cloudflare:workers';
import { drizzle, DrizzleSqliteDODatabase } from 'drizzle-orm/durable-sqlite';
import { migrate } from 'drizzle-orm/durable-sqlite/migrator';
import migrations from '../drizzle/trips/migrations';
import { telemetrySetter, telemetryTable } from './db/telemetry';
import { asc, gt } from 'drizzle-orm/sqlite-core/expressions';
import { telemetrySchema } from './validation/telemetry';
import type z from 'zod/v4';

export class TelemetryDataServer extends DurableObject {
	storage: DurableObjectStorage;
	db: DrizzleSqliteDODatabase<{ telemetry: typeof telemetryTable }>;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.storage = ctx.storage;
		this.db = drizzle(this.storage, { logger: false, schema: { telemetry: telemetryTable } });

		// Make sure this instance has the right schema
		void ctx.blockConcurrencyWhile(async () => {
			await migrate(this.db, migrations);
		});
	}

	// Take websocket connection
	// eslint-disable-next-line @typescript-eslint/require-await
	async fetch(): Promise<Response> {
		const webSocketPair = new WebSocketPair();
		const [client, server] = Object.values(webSocketPair);

		this.ctx.acceptWebSocket(server);

		return new Response(null, {
			status: 101,
			webSocket: client,
		});
	}

	webSocketMessage(_ws: WebSocket, message: string | ArrayBuffer): void | Promise<void> {
		const res = telemetrySchema.safeParse(
			JSON.parse(typeof message === 'string' ? message : new TextDecoder().decode(message))
		);
		if (!res.success) return console.error('Invalid request, ignoring');
		const data = res.data.map((row) => ({ ...row, editedAt: Date.now() }));

		this.db
			.insert(telemetryTable)
			.values(data)
			.onConflictDoUpdate({
				target: telemetryTable.id,
				set: telemetrySetter,
			})
			.then(() => {
				const msg = JSON.stringify(data);
				this.ctx.getWebSockets().forEach((socket) => socket.send(msg));
			})
			.catch(console.error);
	}

	async select(max: number, updatedAfter: number) {
		return await this.db.query.telemetry.findMany({
			limit: max,
			orderBy: asc(telemetryTable.editedAt),
			where: gt(telemetryTable.editedAt, updatedAfter),
		});
	}

	async upload(rows: z.infer<typeof telemetrySchema>) {
		const data = rows.map((row) => ({ ...row, editedAt: Date.now() }));
		await this.db.insert(telemetryTable).values(data).onConflictDoUpdate({
			target: telemetryTable.id,
			set: telemetrySetter,
		});
		const msg = JSON.stringify(data);
		this.ctx.getWebSockets().forEach((socket) => socket.send(msg));
		return data;
	}

	webSocketClose(ws: WebSocket, code: number, reason: string) {
		ws.close(code, reason);
	}
}

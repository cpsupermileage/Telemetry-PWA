import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	out: './drizzle/telemetry',
	schema: './server/db/trips.ts',
	dialect: 'sqlite',
	driver: 'durable-sqlite',
});

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	out: './drizzle/telemetry',
	schema: './server/db/telemetry.ts',
	dialect: 'sqlite',
	driver: 'durable-sqlite',
});

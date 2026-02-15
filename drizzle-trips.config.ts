import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	out: './drizzle/trips',
	schema: './server/db/trips.ts',
	dialect: 'sqlite',
	driver: 'durable-sqlite',
});

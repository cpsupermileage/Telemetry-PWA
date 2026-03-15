import { integer, index, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import buildConflictUpdateColumns from '../util/buildConflictUpdateColumns';

export const tripsTable = sqliteTable(
	'trips',
	{
		id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
		name: text('name', { mode: 'text', length: 512 }).notNull(),
		type: integer('type', { mode: 'number' }).notNull(),
		car: integer('car', { mode: 'number' }).notNull(),
		createdAt: integer('created_at', { mode: 'number' }).notNull(),
		startedAt: integer('started_at', { mode: 'number' }),
		endedAt: integer('ended_at', { mode: 'number' }),
		// For syncing
		editedAt: integer('edited_at', { mode: 'number' }).notNull(),
	},
	(table) => [index('idx_trips_editedAt').on(table.editedAt)]
);

export const tripSetter = buildConflictUpdateColumns(tripsTable);

import { integer, index, sqliteTable, real, text } from 'drizzle-orm/sqlite-core';

export const tripsTable = sqliteTable(
	'trips',
	{
		id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
		name: text('name', { mode: 'text', length: 512 }).notNull(),
		type: integer('type', { mode: 'number' }).notNull(),
		createdAt: integer('created_at', { mode: 'number' }).notNull(),
		startedAt: integer('started_at', { mode: 'number' }),
		endedAt: integer('ended_at', { mode: 'number' }),
		// For syncing
		editedAt: integer('edited_at', { mode: 'number' }).notNull(),
	},
	(table) => [index('idx_editedAt').on(table.editedAt)]
);

export const telemetryTable = sqliteTable(
	'telemetry',
	{
		id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
		tripId: integer('trip_id', { mode: 'number' }).notNull(),
		time: integer('time', { mode: 'number' }).notNull(),
		// data values
		tempMosfet: real('temp_mosfet'),
		tempMotor: real('temp_motor'),
		motorCurrent: real('motor_current'),
		inputCurrent: real('input_current'),
		dutyCycle: real('duty_cycle'),
		tacho: integer('tacho', { mode: 'number' }),
		rpm: real('rpm'),
		volts: real('volts'),
		wattHours: real('watt_hours'),
		error: integer('error', { mode: 'number' }),
		// phone values
		lat: real('lat'),
		long: real('long'),
		heading: real('heading'),
		// For syncing
		editedAt: integer('edited_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		index('idx_tripId').on(table.tripId),
		index('idx_time').on(table.time),
		index('idx_editedAt').on(table.editedAt),
	]
);

import { integer, index, sqliteTable, real } from 'drizzle-orm/sqlite-core';
import buildConflictUpdateColumns from '../util/buildConflictUpdateColumns';

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
		index('idx_telemetry_editedAt').on(table.editedAt),
	]
);

export const telemetrySetter = buildConflictUpdateColumns(telemetryTable);

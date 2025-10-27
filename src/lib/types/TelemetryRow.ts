import type { Row } from '@electric-sql/client';
import type { MC_FAULT_CODE } from './CarState';

export interface TelemetryRow extends Row {
	id: number;
	tripId: number;
	time: string;
	// data values
	tempMosfet: number | null;
	tempMotor: number | null;
	motorCurrent: number | null;
	inputCurrent: number | null;
	dutyCycle: number | null;
	tacho: number | null;
	rpm: number | null;
	volts: number | null;
	wattHours: number | null;
	error: MC_FAULT_CODE | null;
	// phone values
	lat: number | null;
	long: number | null;
}

export interface LocalTelemetryRow extends TelemetryRow {
	hasPushed: number; // 0 or 1
}

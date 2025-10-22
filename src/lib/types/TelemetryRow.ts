import type { MC_FAULT_CODE } from './CarState';

export interface TelemetryRow {
	id: number;
	tripId: number;
	time: Date;
	// data values
	tempMosfet?: number;
	tempMotor?: number;
	motorCurrent?: number;
	inputCurrent?: number;
	dutyCycle?: number;
	tacho?: number;
	rpm?: number;
	volts?: number;
	wattHours?: number;
	error?: MC_FAULT_CODE;
	// phone values
	lat?: number;
	long?: number;
}

export interface LocalTelemetryRow extends TelemetryRow {
	hasPushed: number; // 0 or 1
}

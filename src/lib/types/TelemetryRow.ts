import type { Row } from '@electric-sql/client';
import type { CarState } from './CarState';

export interface TelemetryRow extends Row, CarState {
	// header
	id: number;
	tripId: number;
	time: number;

	// data values
	// inherited from CarState

	// phone values
	lat: number | null;
	long: number | null;
	heading: number | null;
}

export interface LocalTelemetryRow extends TelemetryRow {
	hasLocalChanges: number; // 0 or 1
}

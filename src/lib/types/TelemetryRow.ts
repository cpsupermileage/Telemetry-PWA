import type { CarState } from './CarState';

export interface TelemetryRow extends CarState {
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
	// For syncing
	editedAt: number; // 0 means it is local and needs to be synced to the server
}

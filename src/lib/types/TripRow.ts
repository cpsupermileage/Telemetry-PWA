import type { TripType } from './TripType';

export interface TripRow {
	id: number;
	name: string;
	type: TripType;
	createdAt: number;
	startedAt: number | null;
	endedAt: number | null;
	// For syncing
	editedAt: number; // 0 means it is local and needs to be synced to the server
}

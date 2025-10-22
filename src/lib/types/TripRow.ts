import type { TripType } from './TripType';

export interface TripRow {
	id: number;
	name: string;
	type: TripType;
	startedAt: Date;
}

export interface LocalTripRow extends TripRow {
	hasPushed: number; // 0 or 1
}

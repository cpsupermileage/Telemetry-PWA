import type { Row } from '@electric-sql/client';
import type { TripType } from './TripType';

export interface TripRow extends Row {
	id: number;
	name: string;
	type: TripType;
	createdAt: number;
	startedAt: number | null;
	endedAt: number | null;
}

export interface LocalTripRow extends TripRow {
	hasLocalChanges: number; // 0 or 1
}

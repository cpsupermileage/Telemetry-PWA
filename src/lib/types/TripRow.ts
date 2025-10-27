import type { Row } from '@electric-sql/client';
import type { TripType } from './TripType';

export interface TripRow extends Row {
	id: number;
	name: string;
	type: TripType;
	createdAt: string;
	startedAt: string | null;
}

export interface LocalTripRow extends TripRow {
	hasPushed: number; // 0 or 1
}

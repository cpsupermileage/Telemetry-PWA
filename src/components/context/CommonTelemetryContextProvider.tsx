import type { TelemetryRow } from '@/lib/types/TelemetryRow';
import type { TripRow } from '@/lib/types/TripRow';
import EventEmitter from 'eventemitter3';
import type { DBSchema, IDBPDatabase } from 'idb';
import { createContext, type Dispatch, type SetStateAction } from 'react';

export interface CommonTelemetrySchema extends DBSchema {
	trips: {
		key: number;
		value: TripRow;
		indexes: {
			'by-id': number;
			'by-createdAt': Date;
			'by-startedAt': Date;
		};
	};
	telemetry: {
		key: number;
		value: TelemetryRow;
		indexes: {
			'by-id': number;
			'by-tripId': number;
			'by-time': Date;
		};
	};
}

// The events that can be received
export interface CommonTelemetryEventMap {
	update: () => void;
}

/**
 * The data type that the
 */
export interface CommonTelemetryContextType {
	db?: IDBPDatabase<CommonTelemetrySchema>;
	events: EventEmitter<CommonTelemetryEventMap>;
	trip?: TripRow;
	setTrip: Dispatch<SetStateAction<TripRow | undefined>>;
	setGeolocation?: (pos: GeolocationPosition) => void;
}

/**
 * Access the data that the CommonTelemetryContext provides
 * @example ```js
 * const { db } = useContext(CommonTelemetryContext);
 * ```
 */
export const CommonTelemetryContext = createContext<CommonTelemetryContextType>({
	db: undefined,
	events: new EventEmitter(),
	trip: undefined,
	setTrip: () => {
		throw new Error('setTrip not implemented');
	},
	setGeolocation: undefined,
});

// The actual providers are defined within other components that actually define functionality

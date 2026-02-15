import type { TelemetryRow } from '@/lib/types/TelemetryRow';
import type { TripRow } from '@/lib/types/TripRow';
import { type DBSchema, type IDBPDatabase } from 'idb';
import { createContext, useState } from 'react';
import EventEmitter from 'eventemitter3';
import useIndexedDB from '@/lib/hooks/useIndexedDB';
import useSyncDBToOrigin from '@/lib/hooks/useSyncDBToOrigin';

/**
 * The data type that the context provides
 */
export interface TelemetryContextType {
	db?: IDBPDatabase<TelemetrySchema>;
	events: EventEmitter<TelemetryEventMap>;
}

export interface TelemetrySchema extends DBSchema {
	trips: {
		key: number;
		value: TripRow;
		indexes: {
			'by-id': number;
			'by-createdAt': number;
			'by-editedAt': number;
		};
	};
	telemetry: {
		key: number;
		value: TelemetryRow;
		indexes: {
			'by-id': number;
			'by-tripId': number;
			'by-tripId-time': [number, number];
			'by-tripId-editedAt': [number, number];
		};
	};
}

export interface TelemetryEventMap {
	update: () => void;
	downstreamSyncError: (error: boolean) => void;
	upstreamSyncError: (error: boolean) => void;
}

/**
 * A wrapper for providing the TelemetryContext values to its children.
 */
export default function TelemetryContextProvider({ children }: { children: React.ReactNode }) {
	const [events] = useState<EventEmitter<TelemetryEventMap>>(() => new EventEmitter());

	// Handle the db
	const db = useIndexedDB<TelemetrySchema>('telemetry-cache', 2, {
		upgrade(db) {
			if (db.objectStoreNames.contains('trips')) db.deleteObjectStore('trips');
			if (db.objectStoreNames.contains('telemetry')) db.deleteObjectStore('telemetry');

			const trips = db.createObjectStore('trips', {
				keyPath: 'id',
				autoIncrement: false,
			});
			trips.createIndex('by-id', 'id', { unique: true });
			trips.createIndex('by-createdAt', 'createdAt', { unique: false });
			trips.createIndex('by-editedAt', 'editedAt', { unique: false });

			const telemetry = db.createObjectStore('telemetry', {
				keyPath: 'id',
				autoIncrement: false,
			});
			telemetry.createIndex('by-id', 'id', { unique: true });
			telemetry.createIndex('by-tripId', 'tripId', { unique: false });
			telemetry.createIndex('by-tripId-time', ['tripId', 'time'], { unique: false });
			telemetry.createIndex('by-tripId-editedAt', ['tripId', 'editedAt'], { unique: false });
		},
	});

	// Syncing the trip changes both directions over a websocket
	// Telemetry changes will be handled by the SpectatorContextProvider
	useSyncDBToOrigin(db, 'trips', undefined, events);

	// Returning the value
	const value = {
		db: db as unknown as IDBPDatabase<TelemetrySchema> | undefined,
		events,
	} satisfies TelemetryContextType;

	return <TelemetryContext value={value}>{children}</TelemetryContext>;
}

/**
 * Access the data that the TelemetryContext provides
 * @example ```js
 * const { db } = useContext(TelemetryContext);
 * ```
 */
export const TelemetryContext = createContext<TelemetryContextType>({
	db: undefined,
	events: new EventEmitter(),
});

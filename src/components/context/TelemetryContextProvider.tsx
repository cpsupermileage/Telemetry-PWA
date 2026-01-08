import type { LocalTelemetryRow } from '@/lib/types/TelemetryRow';
import type { LocalTripRow } from '@/lib/types/TripRow';
import { type DBSchema, type IDBPDatabase } from 'idb';
import { createContext, useCallback, useEffect, useState } from 'react';
import EventEmitter from 'eventemitter3';
import useIndexedDB from '@/lib/hooks/useIndexedDB';
import useSyncIndexedDBToCloud from '@/lib/hooks/useSyncIndexedDBToCloud';
import useSyncShapeStreamToIndexedDB from '@/lib/hooks/useSyncShapeStreamToIndexedDB';

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
		value: LocalTripRow;
		indexes: {
			'by-id': number;
			'by-createdAt': number;
			'by-hasLocalChanges': number;
		};
	};
	telemetry: {
		key: number;
		value: LocalTelemetryRow;
		indexes: {
			'by-id': number;
			'by-tripId': number;
			'by-tripId-time': [number, number];
			'by-hasLocalChanges': number;
		};
	};
}

export interface TelemetryEventMap {
	update: () => void;
	downstreamSyncError: (error: boolean) => void;
	upstreamSyncError: (error: boolean) => void;
	downstreamUpToDate: () => void;
}

export const API_BASE = import.meta.env.PUBLIC_API_BASE as string | undefined;

/**
 * A wrapper for providing the TelemetryContext values to its children.
 */
export default function TelemetryContextProvider({ children }: { children: React.ReactNode }) {
	const [events] = useState<EventEmitter<TelemetryEventMap>>(() => new EventEmitter());

	// Handle the db
	const db = useIndexedDB<TelemetrySchema>('telemetry-cache', 1, {
		upgrade(db) {
			const trips = db.createObjectStore('trips', {
				keyPath: 'id',
				autoIncrement: false,
			});
			trips.createIndex('by-id', 'id', { unique: true });
			trips.createIndex('by-createdAt', 'createdAt', { unique: false });
			trips.createIndex('by-hasLocalChanges', 'hasLocalChanges', { unique: false });

			const telemetry = db.createObjectStore('telemetry', {
				keyPath: 'id',
				autoIncrement: false,
			});
			telemetry.createIndex('by-id', 'id', { unique: true });
			telemetry.createIndex('by-tripId', 'tripId', { unique: false });
			telemetry.createIndex('by-tripId-time', ['tripId', 'time'], { unique: false });
			telemetry.createIndex('by-hasLocalChanges', 'hasLocalChanges', { unique: false });
		},
	});

	// Syncing the cloud changes from the server to local
	// Always sync trip changes, telemetry changes will be handled by the SpectatorContextProvider
	useSyncShapeStreamToIndexedDB(new URL('/api/trips', API_BASE).toString(), db, 'trips', events);

	// Syncing the local changes to the cloud
	const syncTripsToCloud = useSyncIndexedDBToCloud(db, 'trips', '/api/trips/many');
	const syncTelemetryToCloud = useSyncIndexedDBToCloud(db, 'telemetry', '/api/telemetry/many');
	const onUpstreamSuccess = useCallback(
		(uploaded: boolean) => void (uploaded && events.emit('upstreamSyncError', false)),
		[events]
	);
	const onUpstreamError = useCallback(
		(error: unknown) => {
			console.error(error);
			events.emit('upstreamSyncError', true);
		},
		[events]
	);
	// Attempt push every 5 seconds
	useEffect(() => {
		function sync() {
			void syncTripsToCloud().then(onUpstreamSuccess, onUpstreamError);
			void syncTelemetryToCloud().then(onUpstreamSuccess, onUpstreamError);
		}
		const interval = setInterval(sync, 5 * 1000); // 5 seconds
		return () => clearInterval(interval);
	}, [syncTelemetryToCloud, syncTripsToCloud, onUpstreamSuccess, onUpstreamError]);
	// ... or on db update
	useEffect(() => {
		function sync() {
			void syncTripsToCloud().then(onUpstreamSuccess, onUpstreamError);
			void syncTelemetryToCloud().then(onUpstreamSuccess, onUpstreamError);
		}
		events.on('update', sync);
		return () => void events.off('update', sync);
	}, [events, syncTelemetryToCloud, syncTripsToCloud, onUpstreamSuccess, onUpstreamError]);

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

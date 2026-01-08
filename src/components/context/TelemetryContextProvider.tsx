import type { LocalTelemetryRow } from '@/lib/types/TelemetryRow';
import type { LocalTripRow } from '@/lib/types/TripRow';
import { type DBSchema, type IDBPDatabase } from 'idb';
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import EventEmitter from 'eventemitter3';
import useIndexedDB from '@/lib/hooks/useIndexedDB';
import useSyncIndexedDBToCloud from '@/lib/hooks/useSyncIndexedDBToCloud';
import useSyncShapeStreamToIndexedDB from '@/lib/hooks/useSyncShapeStreamToIndexedDB';
import { camelCaseKeys } from '@/lib/utils/camelCase';
import type { ShapeStreamOptions } from '@electric-sql/client';
import { bigIntToNumberKeys } from '@/lib/utils/bigIntToNumberKeys';

/**
 * The data type that the context provides
 */
export interface TelemetryContextType {
	db?: IDBPDatabase<TelemetrySchema>;
	events: EventEmitter<TelemetryEventMap>;
	/**
	 * Is downloading trips from cloud?
	 * @default true
	 */
	syncTrips: boolean;
	/**
	 * Should download trips from cloud?
	 */
	setSyncTrips: (syncTrips: boolean) => void;
	/**
	 * Is downloading telemetry entires from cloud?
	 * The value will be the trip of the telemetry being downloaded, or undefined if not syncing.
	 * @default undefined
	 */
	syncTelemetryTripId: number | undefined;
	/**
	 * Should download telemetry entries from cloud?
	 * Because it should only sync one trip's telemetry at once (instead of the whole db), specify the id of the trip.
	 * Set undefined to disable.
	 */
	setSyncTelemetryTripId: (telemetryTripId: number | undefined) => void;
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
}

const API_BASE = import.meta.env.PUBLIC_API_BASE as string | undefined;

/**
 * A wrapper for providing the TelemetryContext values to its children.
 */
export default function TelemetryContextProvider({ children }: { children: React.ReactNode }) {
	const [events] = useState<EventEmitter<TelemetryEventMap>>(() => new EventEmitter());

	const [syncTrips, setSyncTrips] = useState<boolean>(true);
	const [syncTelemetryTripId, setSyncTelemetryTripId] = useState<number | undefined>(undefined);

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
	const restOptions = useMemo<Partial<ShapeStreamOptions<never>>>(
		() => ({
			subscribe: true,
			transformer: (row: object) => bigIntToNumberKeys(camelCaseKeys(row)),
			onError: (error: Error) => {
				events.emit('downstreamSyncError', true);
				console.error(error);
				return {}; // To continue retrying with the same options
			},
			backoffOptions: {
				initialDelay: 500,
				multiplier: 1.2,
				maxDelay: 5000,
				onFailedAttempt: () => events.emit('downstreamSyncError', true),
			},
		}),
		[events]
	);
	useSyncShapeStreamToIndexedDB(
		syncTrips ? { url: new URL('/api/trips', API_BASE).toString(), ...restOptions } : undefined,
		db,
		'trips',
		events
	);
	useSyncShapeStreamToIndexedDB(
		syncTelemetryTripId
			? {
					url: new URL('/api/telemetry/' + syncTelemetryTripId, API_BASE).toString(),
					...restOptions,
				}
			: undefined,
		db,
		'telemetry',
		events
	);

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
		syncTrips,
		setSyncTrips,
		syncTelemetryTripId,
		setSyncTelemetryTripId,
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
	syncTrips: true,
	setSyncTrips: () => {
		throw new Error('Not implemented');
	},
	syncTelemetryTripId: undefined,
	setSyncTelemetryTripId: () => {
		throw new Error('Not implemented');
	},
});

import type { LocalTelemetryRow } from '@/lib/types/TelemetryRow';
import type { LocalTripRow } from '@/lib/types/TripRow';
import { type DBSchema, type IDBPDatabase } from 'idb';
import { createContext, useEffect, useState } from 'react';
import EventEmitter from 'eventemitter3';
import useIndexedDB from '@/lib/utils/useIndexedDB';
import useSyncIndexedDBToCloud from '@/lib/utils/useSyncIndexedDBToCloud';
import useSyncShapeStreamToIndexedDB from '@/lib/utils/useSyncShapeStreamToIndexedDB';
import { camelCaseKeys } from '@/lib/utils/camelCase';

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
			'by-createdAt': Date;
			'by-startedAt': Date;
			'by-endedAt': Date;
			'by-hasLocalChanges': number;
		};
	};
	telemetry: {
		key: number;
		value: LocalTelemetryRow;
		indexes: {
			'by-id': number;
			'by-tripId': number;
			'by-time': Date;
			'by-hasLocalChanges': number;
		};
	};
}

export interface TelemetryEventMap {
	update: () => void;
}

const API_BASE = import.meta.env.PUBLIC_API_BASE as string | undefined;

/**
 * A wrapper for providing the DriverTelemetryContext values to its children.
 */
export default function DriverTelemetryContextProvider({ children }: { children: React.ReactNode }) {
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
			trips.createIndex('by-startedAt', 'startedAt', { unique: false });
			trips.createIndex('by-endedAt', 'endedAt', { unique: false });
			trips.createIndex('by-hasLocalChanges', 'hasLocalChanges', { unique: false });

			const telemetry = db.createObjectStore('telemetry', {
				keyPath: 'id',
				autoIncrement: false,
			});
			telemetry.createIndex('by-id', 'id', { unique: true });
			telemetry.createIndex('by-tripId', 'tripId', { unique: false });
			telemetry.createIndex('by-time', 'time', { unique: false });
			telemetry.createIndex('by-hasLocalChanges', 'hasLocalChanges', { unique: false });
		},
	});

	// Syncing the cloud changes from the server to local
	useSyncShapeStreamToIndexedDB(
		syncTrips
			? { url: new URL('/api/trips', API_BASE).toString(), subscribe: true, transformer: camelCaseKeys }
			: undefined,
		db,
		'trips',
		events
	);
	useSyncShapeStreamToIndexedDB(
		syncTelemetryTripId
			? {
					url: new URL('/api/telemetry/' + syncTelemetryTripId, API_BASE).toString(),
					subscribe: true,
					transformer: camelCaseKeys,
				}
			: undefined,
		db,
		'telemetry',
		events
	);

	// Syncing the local changes to the cloud
	const syncTripsToCloud = useSyncIndexedDBToCloud(db, 'trips', '/api/trips/many');
	const syncTelemetryToCloud = useSyncIndexedDBToCloud(db, 'telemetry', '/api/telemetry/many');
	// Attempt push every 10 seconds
	useEffect(() => {
		function sync() {
			void syncTripsToCloud().catch(console.error);
			void syncTelemetryToCloud().catch(console.error);
		}
		const interval = setInterval(sync, 10 * 1000); // 10 seconds
		return () => clearInterval(interval);
	}, [syncTelemetryToCloud, syncTripsToCloud]);
	// ... or on db update
	useEffect(() => {
		function sync() {
			void syncTripsToCloud().catch(console.error);
			void syncTelemetryToCloud().catch(console.error);
		}
		events.on('update', sync);
		return () => void events.off('update', sync);
	}, [events, syncTelemetryToCloud, syncTripsToCloud]);

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

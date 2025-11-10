import type { LocalTelemetryRow } from '@/lib/types/TelemetryRow';
import type { LocalTripRow, TripRow } from '@/lib/types/TripRow';
import { type IDBPDatabase } from 'idb';
import { use, useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import {
	CommonTelemetryContext,
	type CommonTelemetryContextType,
	type CommonTelemetryEventMap,
	type CommonTelemetrySchema,
} from './CommonTelemetryContextProvider';
import EventEmitter from 'eventemitter3';
import { BluetoothContext, type CharacteristicKeys } from './BluetoothContextProvider';
import useIndexedDB from '@/lib/utils/useIndexedDB';
import debouncedFunction from '@/lib/utils/debouncedFunction';
import genRandomId from '@/lib/utils/genRandomId';
import useSyncIndexedDB from '@/lib/utils/useSyncIndexedDB';
import type { CarState } from '@/lib/types/CarState';

export interface DriverTelemetrySchema extends CommonTelemetrySchema {
	trips: {
		key: number;
		value: LocalTripRow;
		indexes: {
			'by-id': number;
			'by-createdAt': Date;
			'by-startedAt': Date;
			'by-hasPushed': number;
		};
	};
	telemetry: {
		key: number;
		value: LocalTelemetryRow;
		indexes: {
			'by-id': number;
			'by-tripId': number;
			'by-time': Date;
			'by-hasPushed': number;
		};
	};
}

/**
 * A wrapper for providing the DriverTelemetryContext values to its children.
 */
export default function DriverTelemetryContextProvider({ children }: { children: ReactElement }) {
	const ble = use(BluetoothContext);

	const [events] = useState<EventEmitter<CommonTelemetryEventMap>>(() => new EventEmitter());
	const [trip, setTrip] = useState<TripRow | undefined>(undefined);

	// Handle the db
	const db = useIndexedDB<DriverTelemetrySchema>('driver-telemetry-cache', 1, {
		upgrade(db) {
			const trips = db.createObjectStore('trips', {
				keyPath: 'id',
				autoIncrement: false,
			});
			trips.createIndex('by-id', 'id', { unique: true });
			trips.createIndex('by-createdAt', 'createdAt', { unique: false });
			trips.createIndex('by-startedAt', 'startedAt', { unique: false });
			trips.createIndex('by-hasPushed', 'hasPushed', { unique: false });

			const telemetry = db.createObjectStore('telemetry', {
				keyPath: 'id',
				autoIncrement: false,
			});
			telemetry.createIndex('by-id', 'id', { unique: true });
			telemetry.createIndex('by-tripId', 'tripId', { unique: false });
			telemetry.createIndex('by-time', 'time', { unique: false });
			telemetry.createIndex('by-hasPushed', 'hasPushed', { unique: false });
		},
	});

	const syncTrips = useSyncIndexedDB(db, 'trips', '/api/trips/many');
	const syncTelemetry = useSyncIndexedDB(db, 'telemetry', '/api/telemetry/many');

	useEffect(() => {
		function sync() {
			void syncTrips().catch(console.error);
			void syncTelemetry().catch(console.error);
		}
		const interval = setInterval(sync, 10 * 1000); // 10 seconds
		return () => clearInterval(interval);
	});

	// If not already exists, adds to db, if it does exist, patch the current entry
	const setDriverTrip = useCallback(
		async (trip: Omit<TripRow, 'id'> | TripRow | undefined) => {
			if (trip === undefined) return setTrip(undefined);

			if (!db) return console.error('Attempted to push trip to db, but db is undefined');

			const id = 'id' in trip && typeof trip.id === 'number' ? trip.id : genRandomId();

			// @ts-expect-error Trust me bro
			await db.put('trips', {
				...trip,
				id,
				hasPushed: 0,
			});
			// @ts-expect-error Trust me bro
			setTrip({
				...trip,
				id,
			});
			events.emit('update');
			void syncTrips();
		},
		[db, events, syncTrips]
	);

	const cache = useRef<Partial<CarState>>({});
	const geoCache = useRef<GeolocationPosition | undefined>(undefined);

	// Function for taking the cached data and putting it in the db
	const postTelemetry = useCallback(async () => {
		if (!db) return console.error('Attempted to push telemetry to db, but db is undefined');
		if (!trip) return console.error('Attempted to push telemetry to db, but trip is undefined');
		if (!cache.current && !geoCache.current) return; // If there is no new data, ignore

		await db.put('telemetry', {
			id: genRandomId(),
			tripId: trip.id,
			time: new Date().toISOString(),
			...{
				// Default all values as null
				tempMosfet: null,
				tempMotor: null,
				motorCurrent: null,
				inputCurrent: null,
				dutyCycle: null,
				tacho: null,
				rpm: null,
				volts: null,
				wattHours: null,
				error: null,
				// Inject cache
				...cache,
			},
			lat: geoCache.current?.coords.latitude ?? null,
			long: geoCache.current?.coords.longitude ?? null,
			hasPushed: 0,
		});

		// Clear caches immediately after we push to db
		cache.current = {};
		geoCache.current = undefined;
		// Notify of db update so components can update
		events.emit('update');
		// Update the server
		void syncTelemetry().catch(console.error);
	}, [db, events, trip, syncTelemetry]);

	// Handle incoming ble data and put the characteristic updates in the cache
	useEffect(() => {
		if (!ble) return;

		// Makes it so pushToDB() will only be called max every 250ms
		const tryPost = debouncedFunction(postTelemetry, 250);

		function onCharUpdate(name: CharacteristicKeys, value: number) {
			cache.current[name] = value;
			tryPost();
		}

		ble.events.on('characteristicUpdate', onCharUpdate);
		return () => {
			ble.events.off('characteristicUpdate', onCharUpdate);
		};
	}, [ble, postTelemetry]);

	// Exists so the google maps embed can update the values that are logged, puts them in a cache
	const setGeolocation = useCallback((pos: GeolocationPosition) => {
		geoCache.current = pos;
	}, []);

	// Returning the value
	const value = {
		type: 'driver',
		db: db as unknown as IDBPDatabase<CommonTelemetrySchema> | undefined,
		events,
		trip,
		setDriverTrip,
		setGeolocation,
	} satisfies CommonTelemetryContextType;

	return <CommonTelemetryContext value={value}>{children}</CommonTelemetryContext>;
}

import type { TripRow } from '@/lib/types/TripRow';
import { createContext, use, useCallback, useEffect, useRef, useState } from 'react';
import { BluetoothContext, type CharacteristicKeys } from './BluetoothContextProvider';
import genRandomId from '@/lib/utils/genRandomId';
import type { CarState } from '@/lib/types/CarState';
import { TelemetryContext } from './TelemetryContextProvider';
import useSyncDBToOrigin from '@/lib/hooks/useSyncDBToOrigin';
import useQuery from '@/lib/hooks/useQuery';

/**
 * The data type that the context provides
 */
export interface DriverContextType {
	trip: TripRow | undefined;
	setTrip: (trip: Omit<TripRow, 'id'> | TripRow | undefined) => Promise<void>;
	setGeolocation: (pos: GeolocationPosition) => void;
}

/**
 * A wrapper for providing the DriverContext values to its children.
 */
export default function DriverContextProvider({ children }: { children: React.ReactNode }) {
	const ble = use(BluetoothContext);
	const { db, events } = use(TelemetryContext);
	const [tripId, setTripId] = useState<number | undefined>(undefined);
	const trip = useQuery(
		useCallback(
			async (db) => {
				if (!tripId) return;
				const trip = await db.get('trips', tripId);
				if (trip?.editedAt) setTripId(undefined);
				return trip;
			},
			[tripId]
		),
		undefined
	);

	// Sync the telemetry entries of this trip to the db
	useSyncDBToOrigin(db, 'telemetry', trip?.id, events);

	// If not already exists, adds to db, if it does exist, patch the current entry
	const setTrip = useCallback(
		async (trip: Omit<TripRow, 'id'> | TripRow | undefined) => {
			if (trip === undefined) return setTripId(undefined);

			if (!db) return console.error('Attempted to push trip to db, but db is undefined');

			const id = 'id' in trip && typeof trip.id === 'number' ? trip.id : genRandomId();

			await db.put('trips', {
				...trip,
				id,
				editedAt: 0,
			});
			setTripId(id);
			events.emit('update');
		},
		[db, events]
	);

	const cache = useRef<CarState>({
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
	});
	const geoCache = useRef<GeolocationPosition | undefined>(undefined);

	// Function for taking the cached data and putting it in the db
	const postTelemetry = useCallback(async () => {
		if (!db) return console.error('Attempted to push telemetry to db, but db is undefined');
		if (!trip) return;
		if (!cache.current && !geoCache.current) return; // If there is no new data, ignore

		await db.put('telemetry', {
			id: genRandomId(),
			tripId: trip.id,
			time: Date.now(),
			...cache.current,
			lat: geoCache.current?.coords.latitude ?? null,
			long: geoCache.current?.coords.longitude ?? null,
			heading: geoCache.current?.coords.heading ?? null,
			editedAt: 0,
		});

		//geoCache.current = undefined; // Don't clear geocache bc its update rate is slow
		// Notify of db update
		events.emit('update');
	}, [db, events, trip]);

	// Handle incoming ble data and put the characteristic updates in the cache
	useEffect(() => {
		if (!ble) return;

		function onCharUpdate(name: CharacteristicKeys, value: number) {
			cache.current[name] = value;
		}

		ble.events.on('characteristicUpdate', onCharUpdate);
		return () => {
			ble.events.off('characteristicUpdate', onCharUpdate);
		};
	}, [ble]);

	useEffect(() => {
		if (!trip) return;
		const interval = setInterval(postTelemetry, 250);
		return () => clearInterval(interval);
	}, [postTelemetry, trip]);

	// Exists so the google maps embed can update the values that are logged, puts them in a cache
	const setGeolocation = useCallback((pos: GeolocationPosition) => {
		geoCache.current = pos;
	}, []);

	// Returning the value
	const value = {
		trip,
		setTrip,
		setGeolocation,
	} satisfies DriverContextType;

	return <DriverContext value={value}>{children}</DriverContext>;
}

/**
 * Access the data that the DriverContext provides
 * @example ```js
 * const { trip, setTrip } = useContext(DriverContext);
 * ```
 */
export const DriverContext = createContext<DriverContextType | undefined>(undefined);

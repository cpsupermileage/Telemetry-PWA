import type { TripRow } from '@/lib/types/TripRow';
import { createContext, use, useCallback, useEffect, useRef, useState } from 'react';
import { BluetoothContext, type CharacteristicKeys } from './BluetoothContextProvider';
import genRandomId from '@/lib/utils/genRandomId';
import type { CarState } from '@/lib/types/CarState';
import { TelemetryContext } from './TelemetryContextProvider';
import useSyncDBToOrigin from '@/lib/hooks/useSyncDBToOrigin';

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
	const [trip, _setTrip] = useState<TripRow | undefined>(undefined);

	// Sync the telemetry entries of this trip to the db
	useSyncDBToOrigin(db, 'telemetry', trip?.id, events);

	// If not already exists, adds to db, if it does exist, patch the current entry
	const setTrip = useCallback(
		async (trip: Omit<TripRow, 'id'> | TripRow | undefined) => {
			if (trip === undefined) return _setTrip(undefined);

			if (!db) return console.error('Attempted to push trip to db, but db is undefined');

			const id = 'id' in trip && typeof trip.id === 'number' ? trip.id : genRandomId();

			await db.put('trips', {
				...trip,
				id,
				editedAt: 0,
			});
			_setTrip({
				...trip,
				id,
				editedAt: 0,
			});
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
	}, [ble, postTelemetry]);

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

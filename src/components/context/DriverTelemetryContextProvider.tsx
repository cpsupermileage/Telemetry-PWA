import type { LocalTelemetryRow } from '@/lib/types/TelemetryRow';
import type { LocalTripRow, TripRow } from '@/lib/types/TripRow';
import { type IDBPDatabase } from 'idb';
import { use, useEffect, useState, type ReactElement } from 'react';
import {
	CommonTelemetryContext,
	type CommonTelemetryEventMap,
	type CommonTelemetrySchema,
} from './CommonTelemetryContextProvider';
import EventEmitter from 'eventemitter3';
import { BluetoothContext, type CharacteristicKeys } from './BluetoothContextProvider';
import useIndexedDB from '@/lib/utils/useIndexedDB';

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
	const [events] = useState<EventEmitter<CommonTelemetryEventMap>>(() => new EventEmitter());
	const [trip, setTrip] = useState<TripRow | undefined>(undefined);

	// Handle the db
	const db = useIndexedDB<DriverTelemetrySchema>('driver-telemetry-cache', 1, {
		upgrade(db) {
			const trips = db.createObjectStore('trips', {
				keyPath: 'id',
			});
			trips.createIndex('by-id', 'id', { unique: true });
			trips.createIndex('by-createdAt', 'createdAt', { unique: false });
			trips.createIndex('by-startedAt', 'startedAt', { unique: false });
			trips.createIndex('by-hasPushed', 'hasPushed', { unique: false });

			const telemetry = db.createObjectStore('telemetry', {
				keyPath: 'id',
			});
			telemetry.createIndex('by-id', 'id', { unique: true });
			telemetry.createIndex('by-tripId', 'tripId', { unique: false });
			telemetry.createIndex('by-time', 'time', { unique: false });
			telemetry.createIndex('by-hasPushed', 'hasPushed', { unique: false });
		},
	});

	// Handling incoming bluetooth data
	const ble = use(BluetoothContext);

	useEffect(() => {
		if (!db || !ble || !trip) return;

		const cache: Partial<Record<CharacteristicKeys, number>> = {};

		let timeout: number | undefined = undefined;
		let lastPush = 0; // epoch
		function onCharUpdate(name: CharacteristicKeys, value: number) {
			cache[name] = value;

			clearTimeout(timeout);
			if (Date.now() - lastPush > 250) pushToDB();
			else timeout = setTimeout(pushToDB, 250);
		}

		function pushToDB() {
			lastPush = Date.now();
			if (!db) return console.error('Attempted to push data to db, but db is undefined');
			if (!trip) return console.error('Attempted to push data to db, but trip is undefined');
			void db
				.put('telemetry', {
					id: Math.random(), // TODO
					tripId: trip.id,
					time: new Date(),
					...cache,
					// TODO: lat & long
					hasPushed: 0,
				})
				.then(() => {
					events.emit('update');
				});
		}

		ble.events.on('characteristicUpdate', onCharUpdate);
		return () => {
			ble.events.off('characteristicUpdate', onCharUpdate);
		};
	}, [ble, db, events, trip]);

	// Returning the value
	const value = {
		db: db as unknown as IDBPDatabase<CommonTelemetrySchema> | undefined,
		events,
		trip,
		setTrip,
	};

	return <CommonTelemetryContext value={value}>{children}</CommonTelemetryContext>;
}

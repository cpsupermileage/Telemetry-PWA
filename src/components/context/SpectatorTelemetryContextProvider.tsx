import { useEffect, useState, type ReactElement } from 'react';
import {
	CommonTelemetryContext,
	type CommonTelemetryContextType,
	type CommonTelemetryEventMap,
	type CommonTelemetrySchema,
} from './CommonTelemetryContextProvider';
import EventEmitter from 'eventemitter3';
import useIndexedDB from '@/lib/utils/useIndexedDB';
import useSyncShapeStreamToIndexedDB from '@/lib/utils/useSyncShapeStreamToIndexedDB';
import { camelCaseKeys } from '@/lib/utils/camelCase';
import type { TripRow } from '@/lib/types/TripRow';

const API_BASE = import.meta.env.PUBLIC_API_BASE as string | undefined;

/**
 * A wrapper for providing the SpectatorTelemetryContext values to its children.
 */
export default function SpectatorTelemetryContextProvider({ children }: { children: ReactElement }) {
	const [events] = useState<EventEmitter<CommonTelemetryEventMap>>(() => new EventEmitter());
	const [tripId, setTripId] = useState<number | undefined>(undefined);

	// Handle the db
	const db = useIndexedDB<CommonTelemetrySchema>('spectator-telemetry-cache', 1, {
		upgrade(db) {
			const trips = db.createObjectStore('trips', {
				keyPath: 'id',
				autoIncrement: false,
			});
			trips.createIndex('by-id', 'id', { unique: true });
			trips.createIndex('by-createdAt', 'createdAt', { unique: false });
			trips.createIndex('by-startedAt', 'startedAt', { unique: false });

			const telemetry = db.createObjectStore('telemetry', {
				keyPath: 'id',
				autoIncrement: false,
			});
			telemetry.createIndex('by-id', 'id', { unique: true });
			telemetry.createIndex('by-tripId', 'tripId', { unique: false });
			telemetry.createIndex('by-time', 'time', { unique: false });
		},
	});

	useSyncShapeStreamToIndexedDB(
		{ url: new URL('/api/trips', API_BASE).toString(), subscribe: true, transformer: camelCaseKeys },
		db,
		'trips',
		events
	);
	useSyncShapeStreamToIndexedDB(
		tripId
			? { url: new URL('/api/telemetry/' + tripId, API_BASE).toString(), subscribe: true, transformer: camelCaseKeys }
			: undefined,
		db,
		'telemetry',
		events
	);

	const [trip, setTrip] = useState<TripRow | undefined>(undefined);
	useEffect(() => {
		if (!db || !tripId) return;
		void db.get('trips', tripId).then(setTrip);
	}, [db, tripId]);

	// Returning the value
	const value = {
		type: 'spectator',
		db,
		events,
		trip,
		setSpectatorTripId: setTripId,
	} satisfies CommonTelemetryContextType;

	return <CommonTelemetryContext value={value}>{children}</CommonTelemetryContext>;
}

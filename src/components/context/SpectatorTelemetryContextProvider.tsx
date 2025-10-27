import type { TripRow } from '@/lib/types/TripRow';
import { useEffect, useState, type ReactElement } from 'react';
import {
	CommonTelemetryContext,
	type CommonTelemetryContextType,
	type CommonTelemetryEventMap,
	type CommonTelemetrySchema,
} from './CommonTelemetryContextProvider';
import EventEmitter from 'eventemitter3';
import useIndexedDB from '@/lib/utils/useIndexedDB';
import { ShapeStream } from '@electric-sql/client';
import { camelCaseKeys } from '@/lib/utils/camelCase';

const API_BASE = import.meta.env.PUBLIC_API_BASE as string | undefined;

/**
 * A wrapper for providing the SpectatorTelemetryContext values to its children.
 */
export default function SPectatorTelemetryContextProvider({ children }: { children: ReactElement }) {
	const [events] = useState<EventEmitter<CommonTelemetryEventMap>>(() => new EventEmitter());
	const [trip] = useState<TripRow | undefined>(undefined);

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

	useEffect(() => {
		const aborter = new AbortController();
		const stream = new ShapeStream<TripRow>({
			url: new URL('/api/trips', API_BASE).toString(),
			subscribe: true,
			signal: aborter.signal,
			transformer: camelCaseKeys,
		});

		stream.subscribe((messages) => {
			messages.forEach(console.log);
		});

		return () => {
			aborter.abort();
			stream.unsubscribeAll();
		};
	}, []);

	// Returning the value
	const value = {
		type: 'spectator',
		db,
		events,
		trip,
	} satisfies CommonTelemetryContextType;

	return <CommonTelemetryContext value={value}>{children}</CommonTelemetryContext>;
}

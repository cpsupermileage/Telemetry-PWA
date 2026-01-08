import { createContext, use, useEffect, useState } from 'react';
import { API_BASE, TelemetryContext } from './TelemetryContextProvider';
import { useParams } from 'react-router';
import useSyncShapeStreamToIndexedDB from '@/lib/hooks/useSyncShapeStreamToIndexedDB';

/**
 * The data type that the context provides
 */
export interface SpectatorContextType {
	tripId: number | undefined;
	/**
	 * During playback, this is the current time of the trip we are viewing up to, or undefined if its the live feed
	 */
	time: number | undefined;
	setTime: React.Dispatch<React.SetStateAction<number | undefined>>;
	/**
	 * Wether or not the time should increase automatically.
	 */
	paused: boolean;
	setPaused: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * A wrapper for providing the SpectatorTelemetryContext values to its children.
 */
export default function SpectatorTelemetryContextProvider({ children }: { children: React.ReactNode }) {
	const { db, events } = use(TelemetryContext);

	const params = useParams();
	const tripId = parseInt(params.tripId!);

	// Sync the telemetry entries of this trip to the db
	useSyncShapeStreamToIndexedDB(new URL('/api/telemetry/' + tripId, API_BASE).toString(), db, 'telemetry', events);

	const [time, setTime] = useState<number | undefined>(undefined);
	const [paused, setPaused] = useState<boolean>(false);

	// During playback and not paused, move forward to the next entry automatically
	useEffect(() => {
		if (!db || !tripId || time === undefined || paused) return;
		const start = Date.now();
		let timeout: number | undefined | null = undefined;

		// Fetch the next entry in the db and delay using setTimeout to set the current one to that one
		void (async () => {
			const tx = db.transaction('telemetry', 'readonly');
			const cursor = await tx
				.objectStore('telemetry')
				.index('by-tripId-time')
				.openKeyCursor(IDBKeyRange.bound([tripId, time], [tripId, Number.MAX_SAFE_INTEGER], true));
			if (!cursor) return;
			const [, nextEntryTime] = cursor.key;
			await tx.done;
			const timeToNext = nextEntryTime - time - (Date.now() - start); // subtract the time it took to call the db
			if (timeout === null) return; // If the component has already been dismounted
			timeout = setTimeout(() => {
				setTime(nextEntryTime);
			}, timeToNext);
		})();

		return () => {
			if (timeout) clearTimeout(timeout);
			else timeout = null; // Signal that the timeout can no longer be set
		};
	}, [db, tripId, time, paused]);

	useEffect(() => {
		if (!db || !tripId || time !== undefined || !paused) return;
		// If paused and time is not set, set it to the latest entry time
		void (async () => {
			if (!db) return;
			const tx = db.transaction('telemetry', 'readonly');
			const cursor = await tx
				.objectStore('telemetry')
				.index('by-tripId-time')
				.openKeyCursor(IDBKeyRange.bound([tripId, 0], [tripId, Number.MAX_SAFE_INTEGER], true), 'prev');
			if (!cursor) return;
			const [, time] = cursor.key;
			await tx.done;
			setTime(time);
		})();
	}, [db, tripId, time, paused]);

	// Returning the value
	const value = {
		tripId,
		time,
		setTime,
		paused,
		setPaused,
	} satisfies SpectatorContextType;

	return <SpectatorContext value={value}>{children}</SpectatorContext>;
}

/**
 * Access the data that the SpectatorContext provides
 * @example ```js
 * const { tripId } = useContext(SpectatorContext);
 * ```
 */
export const SpectatorContext = createContext<SpectatorContextType | undefined>(undefined);

import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react';
import { TelemetryContext } from './TelemetryContextProvider';
import { useParams } from 'react-router';
import useQuery from '@/lib/hooks/useQuery';
import useSyncDBToOrigin from '@/lib/hooks/useSyncDBToOrigin';

/**
 * The data type that the context provides
 */
export interface SpectatorContextType {
	tripId: number | undefined;
	/**
	 * During playback, this is the current time of the trip we are viewing up to, or undefined if its the live feed
	 */
	time: number | undefined;
	setTime: (time: number | undefined) => void;
	/**
	 * Wether or not the time should increase automatically.
	 */
	paused: boolean;
	setPaused: (paused: boolean) => void;
	skip: (skipTime: number) => void;
	minTime: number | undefined;
	maxTime: number | undefined;
	isLive: boolean;
}

/**
 * A wrapper for providing the SpectatorTelemetryContext values to its children.
 */
export default function SpectatorTelemetryContextProvider({ children }: { children: React.ReactNode }) {
	const { db, events } = use(TelemetryContext);

	const params = useParams();
	const tripId = useMemo(() => parseInt(params.tripId!), [params]);

	// Sync the telemetry entries of this trip to the db
	useSyncDBToOrigin('/api/telemetry/' + tripId, db, 'telemetry', events);

	const [time, setTime] = useState<number | undefined>(undefined); // Will be undefined if live
	const [paused, _setPaused] = useState<boolean>(false);

	const [minTime, maxTime] = useQuery(
		useCallback(async () => {
			if (!db) return [undefined, undefined];
			const tx = db.transaction('telemetry', 'readonly');
			const minCursor = await tx
				.objectStore('telemetry')
				.index('by-tripId-time')
				.openKeyCursor(IDBKeyRange.bound([tripId, 0], [tripId, Number.MAX_SAFE_INTEGER], true));
			if (!minCursor) return [undefined, undefined];
			const [, min] = minCursor.key;

			const maxCursor = await tx
				.objectStore('telemetry')
				.index('by-tripId-time')
				.openKeyCursor(IDBKeyRange.bound([tripId, 0], [tripId, Number.MAX_SAFE_INTEGER], true), 'prev');
			if (!maxCursor) return [undefined, undefined];
			const [, max] = maxCursor.key;

			return [min, max];
		}, [db, tripId]),
		[undefined, undefined]
	);

	// Determine if the stream is still live by finding if the trip has an end time,
	// and if not, double checking that the most recent entry is within the last hour
	const hasEndTime = useQuery(
		useCallback(async () => {
			if (!db) return true;
			const trip = await db.get('trips', tripId);
			if (!trip) return true;
			return trip.endedAt !== null;
		}, [db, tripId]),
		true
	);
	const isLive = useMemo(
		// eslint-disable-next-line react-hooks/purity
		() => !hasEndTime && (maxTime ?? Date.now()) > Date.now() - 60 * 60 * 1000,
		[hasEndTime, maxTime]
	);

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
			if (!cursor) return _setPaused(true);
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

	const setPaused = useCallback(
		(paused: boolean) => {
			// If pausing while live (time is undefined), update time to the max time
			if (!paused && time === undefined) setTime(maxTime);
			_setPaused(paused);
		},
		[time, maxTime]
	);

	const skip = useCallback(
		(skipTime: number) => {
			if (!maxTime || !minTime) return;
			// Add skipTime to time and keep it within bounds
			setTime(Math.max(Math.min((time ?? maxTime) + skipTime, maxTime), minTime));
		},
		[time, minTime, maxTime]
	);

	// Returning the value
	const value = {
		tripId,
		time,
		setTime,
		paused,
		setPaused,
		skip,
		minTime,
		maxTime,
		isLive,
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

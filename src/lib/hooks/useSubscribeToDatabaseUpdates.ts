import type { IDBPDatabase, StoreNames } from 'idb';
import { useEffect, type EffectCallback } from 'react';
import type EventEmitter from 'eventemitter3';
import type { TelemetryEventMap, TelemetrySchema } from '@/components/context/TelemetryContextProvider';
import type { TripRow } from '../types/TripRow';
import type { TelemetryRow } from '../types/TelemetryRow';
import { toast } from 'sonner';
import apiRequest from '../utils/apiClient';

// Leave options as undefined to disable
export default function useSubscribeToDatabaseUpdates(
	url: string,
	db: IDBPDatabase<TelemetrySchema> | undefined,
	storeName: StoreNames<TelemetrySchema>,
	eventEmitter?: EventEmitter<TelemetryEventMap>
) {
	useEffect(() => {
		if (!db) return;
		return _subscribeToDatabaseUpdates(url, db, storeName, eventEmitter);
	}, [db, eventEmitter, storeName, url]);
}

// Split the logic into its own internal function because im so tired of having to deal with useCallback and whatnot
function _subscribeToDatabaseUpdates(
	url: string,
	db: IDBPDatabase<TelemetrySchema>,
	storeName: StoreNames<TelemetrySchema>,
	eventEmitter?: EventEmitter<TelemetryEventMap>
): ReturnType<EffectCallback> {
	// If we should close everything bc the component is unmounted
	let closed = false;
	// The current websocket conn
	let ws: WebSocket | null = null;
	// Cache all the websocket received values until the history up until now has been synced via http
	let messageBuffer: (TripRow | TelemetryRow)[] = [];
	let httpSyncFinished = false;

	async function syncHttp() {
		httpSyncFinished = false;
		let latestEdit = 0;
		// Due to the different indexes, we need to have different code for getting the latest edit
		if (storeName === 'trips') {
			const tx = db.transaction(storeName, 'readonly');
			const idx = tx.objectStore(storeName).index('by-editedAt');
			const cursor = await idx.openKeyCursor(IDBKeyRange.bound(0, Number.MAX_SAFE_INTEGER), 'prev');
			latestEdit = cursor?.key ?? 0;
		} else {
			const tripId = url.split('/').pop()!; // Awful code workaround but i just want this to work
			const tx = db.transaction(storeName, 'readonly');
			const idx = tx.objectStore(storeName).index('by-tripId-editedAt');
			const cursor = await idx.openKeyCursor(IDBKeyRange.bound([tripId, 0], [tripId, Number.MAX_SAFE_INTEGER]), 'prev');
			latestEdit = cursor?.key[1] ?? 0;
		}
		let res = (await apiRequest('GET', url + '?max=100&updatedAfter=' + latestEdit)) as (TripRow | TelemetryRow)[];
		if (messageBuffer.length > 0) res = res.filter((row) => row.editedAt <= messageBuffer[0].editedAt); // Remove items we've already gotten from the websocket
		if (res.length < 100) httpSyncFinished = true; // If we are caught up on data, or reached where the websocket started collecting data, then we are done
		// Insert all the data
		const tx = db.transaction(storeName, 'readwrite');
		const store = tx.objectStore(storeName);
		for (const row of res) await store.put(row);
		await tx.done;
		// If we still have more to go, call again
		if (!httpSyncFinished && !closed) await syncHttp();
	}

	function connect() {
		if (ws) ws.close();

		const conn = new WebSocket(url + '/ws');

		conn.addEventListener('open', () => eventEmitter?.emit('downstreamSyncError', false));
		conn.addEventListener('error', () => {
			messageBuffer = [];
			eventEmitter?.emit('downstreamSyncError', true);
			// Try again in 1 second
			setTimeout(() => {
				if (!closed) connect();
			}, 1000);
		});
		conn.addEventListener('close', () => (messageBuffer = []));

		conn.addEventListener('message', (e: MessageEvent<string>) => {
			eventEmitter?.emit('downstreamSyncError', false);
			const updates = JSON.parse(e.data) as (TripRow | TelemetryRow)[];
			(async () => {
				if (!httpSyncFinished) return messageBuffer.push(...updates); // Buffer messages until http sync is done
				if (messageBuffer.length > 0) {
					updates.push(...messageBuffer); // If it is done, make sure to add the buffer to the db as well
					messageBuffer = [];
				}
				const tx = db.transaction(storeName, 'readwrite');
				const store = tx.objectStore(storeName);
				for (const row of updates) await store.put(row);
				await tx.done;
			})().catch(() => toast.error('DB error syncing origin changes to local cache'));
		});

		return (ws = conn);
	}

	connect();
	syncHttp().catch(() => toast.error('Error fetching past telemetry data'));

	return () => {
		ws?.close();
		closed = true;
	};
}

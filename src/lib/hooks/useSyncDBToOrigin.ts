import type { IDBPDatabase, StoreNames } from 'idb';
import { useEffect, type EffectCallback } from 'react';
import type EventEmitter from 'eventemitter3';
import type { TelemetryEventMap, TelemetrySchema } from '@/components/context/TelemetryContextProvider';
import type { TripRow } from '../types/TripRow';
import type { TelemetryRow } from '../types/TelemetryRow';
import { toast } from 'sonner';
import apiRequest from '../utils/apiClient';

// Leave options as undefined to disable
export default function useSyncDBToOrigin(
	db: IDBPDatabase<TelemetrySchema> | undefined,
	storeName: StoreNames<TelemetrySchema>,
	tripId?: number,
	eventEmitter?: EventEmitter<TelemetryEventMap>
) {
	useEffect(() => {
		if (!db) return;
		if (storeName === 'telemetry' && tripId === undefined) return;
		return _syncDBToOrigin(db, storeName, tripId, eventEmitter);
	}, [db, storeName, tripId, eventEmitter]);
}

// Split the logic into its own internal function because im so tired of having to deal with useCallback and whatnot
function _syncDBToOrigin(
	db: IDBPDatabase<TelemetrySchema>,
	storeName: StoreNames<TelemetrySchema>,
	tripId?: number,
	eventEmitter?: EventEmitter<TelemetryEventMap>
): ReturnType<EffectCallback> {
	const baseUrl = storeName === 'trips' ? '/api/trips' : '/api/telemetry/' + tripId;
	// If we should close everything bc the component is unmounted
	let closed = false;
	// The current websocket conn
	let ws: WebSocket | null = null;
	// Cache all the websocket received values until the history up until now has been synced via http
	let messageBuffer: (TripRow | TelemetryRow)[] = [];
	let httpSyncFinished = true;

	async function downloadDataOverHttp() {
		httpSyncFinished = false;
		let latestEdit = 0;
		// Due to the different indexes, we need to have different code for getting the latest edit
		if (storeName === 'trips') {
			const tx = db.transaction(storeName, 'readonly');
			const idx = tx.objectStore(storeName).index('by-editedAt');
			const cursor = await idx.openKeyCursor(IDBKeyRange.bound(0, Number.MAX_SAFE_INTEGER), 'prev');
			latestEdit = cursor?.key ?? 0;
		} else {
			const tx = db.transaction(storeName, 'readonly');
			const idx = tx.objectStore(storeName).index('by-tripId-editedAt');
			const cursor = await idx.openKeyCursor(IDBKeyRange.bound([tripId, 0], [tripId, Number.MAX_SAFE_INTEGER]), 'prev');
			latestEdit = cursor?.key[1] ?? 0;
		}
		// Continue downloading everything until we are up to date
		while (!httpSyncFinished && !closed) {
			let res = (await apiRequest('GET', `${baseUrl}?max=100&updatedAfter=${latestEdit}`)) as (
				| TripRow
				| TelemetryRow
			)[];
			if (messageBuffer.length > 0) res = res.filter((row) => row.editedAt <= messageBuffer[0].editedAt); // Remove items we've already gotten from the websocket
			if (res.length < 100)
				httpSyncFinished = true; // If we are caught up on data, or reached where the websocket started collecting data, then we are done
			else latestEdit = Math.max(latestEdit + 1, res[res.length - 1].editedAt);
			// Insert all the data
			const tx = db.transaction(storeName, 'readwrite');
			const store = tx.objectStore(storeName);
			for (const row of res) await store.put(row);
			await tx.done;
		}
	}

	async function uploadLocalUpdateViaWebsocket() {
		if (!ws || ws.readyState != ws.OPEN) return;

		let toSync: (TripRow | TelemetryRow)[] = [];
		if (storeName === 'trips') {
			toSync = await db.getAllFromIndex(storeName, 'by-editedAt', 0, 50);
		} else {
			if (tripId === undefined) return;
			toSync = await db.getAllFromIndex(storeName, 'by-tripId-editedAt', [tripId, 0], 50);
		}
		if (toSync.length == 0) return;

		ws.send(JSON.stringify(toSync));
		// Updates will be received via the websocket events defined below
	}

	function connect() {
		if (ws) ws.close();
		if (httpSyncFinished)
			downloadDataOverHttp().catch((e) => {
				console.error(e);
				toast.error('Error fetching past telemetry data');
			});

		const conn = new WebSocket(`${baseUrl}/ws`);

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
			if (updates.length == 0) return;
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
				eventEmitter?.emit('update');
			})().catch(() => toast.error('DB error syncing origin changes to local cache'));
		});

		return (ws = conn);
	}

	connect();

	function wrappedUploadLocalUpdateViaWebsocket() {
		uploadLocalUpdateViaWebsocket().catch((e) => {
			console.error(e);
			toast.error('Error send local changes over websocket');
		});
	}
	eventEmitter?.on('update', wrappedUploadLocalUpdateViaWebsocket);
	const interval = setInterval(wrappedUploadLocalUpdateViaWebsocket, 5000);

	return () => {
		ws?.close();
		eventEmitter?.off('update', wrappedUploadLocalUpdateViaWebsocket);
		clearInterval(interval);
		closed = true;
	};
}

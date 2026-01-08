import { isChangeMessage, isControlMessage, ShapeStream } from '@electric-sql/client';
import type { IDBPDatabase, StoreNames } from 'idb';
import { useEffect } from 'react';
import type { TripRow } from '../types/TripRow';
import type { TelemetryRow } from '../types/TelemetryRow';
import type EventEmitter from 'eventemitter3';
import type { TelemetryEventMap, TelemetrySchema } from '@/components/context/TelemetryContextProvider';
import { bigIntToNumberKeys } from '../utils/bigIntToNumberKeys';
import { camelCaseKeys } from '../utils/camelCase';

// Leave options as undefined to disable
export default function useSyncShapeStreamToIndexedDB(
	url: string,
	db: IDBPDatabase<TelemetrySchema> | undefined,
	storeName: StoreNames<TelemetrySchema>,
	eventEmitter?: EventEmitter<TelemetryEventMap>
) {
	useEffect(() => {
		if (!db) return;

		// Clear the cache, it will all be re-downloaded anyways
		// void (async () => {
		//     const tx = db.transaction(storeName, "readwrite");
		//     const store = tx.objectStore(storeName);
		//     for (const id of await store.getAllKeys()) {
		//         await store.delete(id)
		//     }
		//     await tx.done;
		// })

		const aborter = new AbortController();
		const stream = new ShapeStream<TripRow | TelemetryRow>({
			url,
			subscribe: true,
			signal: aborter.signal,
			transformer: (row: object) => bigIntToNumberKeys(camelCaseKeys(row)),
			onError: (error: Error) => {
				eventEmitter?.emit('downstreamSyncError', true);
				console.error(error);
				return {}; // To continue retrying with the same options
			},
			backoffOptions: {
				initialDelay: 500,
				multiplier: 1.2,
				maxDelay: 5000,
				onFailedAttempt: () => eventEmitter?.emit('downstreamSyncError', true),
			},
		});

		stream.subscribe(async (messages) => {
			eventEmitter?.emit('downstreamSyncError', false); // Clear the error
			const tx = db.transaction(storeName, 'readwrite');
			const store = tx.objectStore(storeName);
			let hasUpdate = false;
			for (const message of messages) {
				if (isChangeMessage(message)) {
					switch (message.headers.operation) {
						case 'insert':
							await store.put({ ...message.value, hasLocalChanges: 0 });
							break;
						case 'update': {
							const old = await store.get(message.value.id);
							await store.put({ hasLocalChanges: 0, ...old, ...message.value });
							break;
						}
						case 'delete':
							await store.delete(message.value.id);
							break;
					}
					hasUpdate = true;
				} else if (isControlMessage(message)) {
					if (message.headers.control == 'up-to-date') eventEmitter?.emit('downstreamUpToDate');
					// Ignoring the rest of these cause im not paid enough to implement them
				}
			}
			await tx.done;
			if (hasUpdate) eventEmitter?.emit('update');
		});
		const statusInterval = setInterval(() => {
			if (stream.isConnected()) eventEmitter?.emit('downstreamSyncError', false);
		}, 500);

		return () => {
			aborter.abort();
			stream.unsubscribeAll();
			clearInterval(statusInterval);
		};
	}, [url, db, storeName, eventEmitter]);
}

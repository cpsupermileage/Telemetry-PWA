import { isChangeMessage, isControlMessage, ShapeStream, type ShapeStreamOptions } from '@electric-sql/client';
import type { IDBPDatabase, StoreNames } from 'idb';
import { useEffect } from 'react';
import type { TripRow } from '../types/TripRow';
import type { TelemetryRow } from '../types/TelemetryRow';
import type EventEmitter from 'eventemitter3';
import type { TelemetryEventMap, TelemetrySchema } from '@/components/context/TelemetryContextProvider';

// Leave options as undefined to disable
export default function useSyncShapeStreamToIndexedDB(
	options: ShapeStreamOptions<never> | undefined,
	db: IDBPDatabase<TelemetrySchema> | undefined,
	storeName: StoreNames<TelemetrySchema>,
	eventEmitter?: EventEmitter<TelemetryEventMap>
) {
	useEffect(() => {
		if (!db || !options) return;

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
		const stream = new ShapeStream<TripRow | TelemetryRow>(options);

		stream.subscribe(async (messages) => {
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
					// Ignoring all of these cause im not paid enough to implement them
				}
			}
			await tx.done;
			if (hasUpdate) eventEmitter?.emit('update');
		});

		return () => {
			aborter.abort();
			stream.unsubscribeAll();
		};
	}, [db, options, storeName, eventEmitter]);
}

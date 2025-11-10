import type {
	CommonTelemetryEventMap,
	CommonTelemetrySchema,
} from '@/components/context/CommonTelemetryContextProvider';
import { isChangeMessage, isControlMessage, ShapeStream, type ShapeStreamOptions } from '@electric-sql/client';
import type { IDBPDatabase, StoreNames } from 'idb';
import { useEffect } from 'react';
import type { TripRow } from '../types/TripRow';
import type { TelemetryRow } from '../types/TelemetryRow';
import type EventEmitter from 'eventemitter3';

// Leave options as undefined to disable
export default function useSyncShapeStreamToIndexedDB(
	options: ShapeStreamOptions<never> | undefined,
	db: IDBPDatabase<CommonTelemetrySchema> | undefined,
	storeName: StoreNames<CommonTelemetrySchema>,
	eventEmitter?: EventEmitter<CommonTelemetryEventMap>
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
							await store.put(message.value);
							break;
						case 'update': {
							const old = await store.get(message.value.id);
							await store.put({ ...old, ...message.value });
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

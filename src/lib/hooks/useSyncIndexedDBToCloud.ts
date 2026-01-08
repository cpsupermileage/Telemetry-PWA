import { type IDBPDatabase, type StoreNames } from 'idb';
import { useCallback } from 'react';
import apiRequest from '../utils/apiClient';
import type { TelemetrySchema } from '@/components/context/TelemetryContextProvider';

export default function useSyncIndexedDBToCloud(
	db: IDBPDatabase<TelemetrySchema> | undefined,
	storeName: StoreNames<TelemetrySchema>,
	postUrl: string
): () => Promise<boolean> {
	const sync = useCallback(async () => {
		if (!db) throw new Error('Cannot sync when db is undefined');
		const toSync = await db.getAllFromIndex(storeName, 'by-hasLocalChanges', 1, 100);

		if (toSync.length <= 0) return false;

		await apiRequest(
			'POST',
			postUrl,
			toSync.map((entry) => ({ ...entry, hasLocalChanges: undefined }))
		);

		const tx = db.transaction(storeName, 'readwrite');
		const store = tx.objectStore(storeName);
		for (const id of toSync.map((obj) => obj.id)) {
			const entry = await store.index('by-id').get(id);
			await store.put({
				...entry!,
				hasLocalChanges: 0,
			});
		}
		await tx.done;
		return true;
	}, [db, postUrl, storeName]);

	return sync;
}

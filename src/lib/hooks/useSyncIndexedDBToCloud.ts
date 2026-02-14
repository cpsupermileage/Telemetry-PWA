import { type IDBPDatabase, type StoreNames } from 'idb';
import { useCallback } from 'react';
import apiRequest from '../utils/apiClient';
import type { TelemetrySchema } from '@/components/context/TelemetryContextProvider';
import type { TripRow } from '../types/TripRow';
import type { TelemetryRow } from '../types/TelemetryRow';

export default function useSyncIndexedDBToCloud(
	db: IDBPDatabase<TelemetrySchema> | undefined,
	storeName: StoreNames<TelemetrySchema>,
	postUrl: string
): () => Promise<boolean> {
	const sync = useCallback(async () => {
		if (!db) throw new Error('Cannot sync when db is undefined');
		const toSync = await db.getAllFromIndex(storeName, 'by-editedAt', 0, 100);

		if (toSync.length <= 0) return false;

		// Returns the pushed rows with an accurate editedAt value, thats how we know the server got them
		const res = (await apiRequest(
			'POST',
			postUrl,
			toSync.map((entry) => ({ ...entry }))
		)) as (TripRow | TelemetryRow)[];

		// Update the returned rows in our db, which will have an editedAt value other than 0, so we know they don't need to be synced again
		const tx = db.transaction(storeName, 'readwrite');
		const store = tx.objectStore(storeName);
		for (const row of res) await store.put(row);
		await tx.done;
		return true;
	}, [db, postUrl, storeName]);

	return sync;
}

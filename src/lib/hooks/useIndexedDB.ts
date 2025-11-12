import { openDB, type DBSchema, type IDBPDatabase, type OpenDBCallbacks } from 'idb';
import { useEffect, useState } from 'react';

/**
 * Replicates the behavior of `openDB()` from "idb" to work with react, and close when unmounted.
 * Has the exact same parameters as the `openDB` function.
 * @returns An IDBPDatabase instance or undefined if it has not yet been opened
 */
export default function useIndexedDB<DBTypes extends DBSchema>(
	name: string,
	version?: number,
	callbacks?: OpenDBCallbacks<DBTypes>
): IDBPDatabase<DBTypes> | undefined {
	const [db, setDb] = useState<IDBPDatabase<DBTypes> | undefined>(undefined);

	// Handle the db
	useEffect(() => {
		// Have to use a cache here to make sure it can still be closed
		let dbCache: IDBPDatabase<DBTypes> | undefined = undefined;

		void openDB<DBTypes>(name, version, callbacks).then((newDb) => {
			dbCache = newDb;
			setDb(newDb);
		});

		return () => {
			setDb(undefined);
			dbCache?.close();
		};
	}, [name, version, callbacks]);

	return db;
}

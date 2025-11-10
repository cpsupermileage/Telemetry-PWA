import { TelemetryContext, type TelemetrySchema } from '@/components/context/TelemetryContextProvider';
import type { IDBPDatabase } from 'idb';
import { use, useEffect, useState } from 'react';

export default function useQuery<T>(factory: (db: IDBPDatabase<TelemetrySchema>) => Promise<T>, defaultValue: T): T {
	const { db, events } = use(TelemetryContext);

	const [result, setResult] = useState<T>(defaultValue);

	useEffect(() => {
		function getResult() {
			if (!db) return;
			factory(db).then(setResult).catch(console.error);
		}
		getResult();

		events.on('update', getResult);
		return () => void events.off('update', getResult);
	}, [db, events, factory]);

	return result;
}

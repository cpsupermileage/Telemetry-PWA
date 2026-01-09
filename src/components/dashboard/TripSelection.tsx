import Widget from '@/components/dashboard/Widget';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { LocalTripRow } from '@/lib/types/TripRow';
import { TripType } from '@/lib/types/TripType';
import useQuery from '@/lib/hooks/useQuery';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';

function TripSelection() {
	const navigate = useNavigate();

	const trips = useQuery(
		useCallback(async (db) => {
			const tx = db.transaction('trips', 'readonly');

			// Iterate through records by descending createdAt order
			const trips: LocalTripRow[] = [];
			let cursor = await tx.objectStore('trips').index('by-createdAt').openCursor(null, 'prev');
			while (cursor != null) {
				trips.push(cursor.value);
				cursor = await cursor.continue();
			}

			return trips;
		}, []),
		[]
	);

	const currentTripId = useMemo(() => {
		return trips.find(
			(trip) =>
				!trip.endedAt &&
				trip.startedAt &&
				// eslint-disable-next-line react-hooks/purity
				trip.startedAt > Date.now() - 6 * 60 * 60 * 1000
		)?.id;
	}, [trips]);

	function goto(tripId: number) {
		void navigate('/spectator/' + tripId);
	}

	return (
		<Widget className="h-full w-full p-2 pt-0">
			<ScrollArea type="auto" className="h-full w-full">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-1/2 pl-10">Name</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Started At</TableHead>
							<TableHead>Ended At</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{trips.map((trip) => (
							<TableRow
								key={trip.id}
								role="button"
								tabIndex={0}
								onClick={() => goto(trip.id)}
								className="cursor-pointer"
							>
								<TableCell>
									{trip.name}
									{trip.id == currentTripId && (
										<Badge className="ml-2 bg-blue-500 text-white dark:bg-blue-600">Current</Badge>
									)}
								</TableCell>
								<TableCell>
									{trip.type === TripType.TESTING && <Badge variant="secondary">Testing</Badge>}
									{trip.type === TripType.CALIBRATION && (
										<Badge className="bg-yellow-500 text-white dark:bg-yellow-600">Calibration</Badge>
									)}
									{trip.type === TripType.FULL_RUN && (
										<Badge className="bg-green-500 text-white dark:bg-green-600">Full Run</Badge>
									)}
								</TableCell>
								<TableCell>{trip.startedAt ? new Date(trip.startedAt).toLocaleString() : ''}</TableCell>
								<TableCell>{trip.endedAt ? new Date(trip.endedAt).toLocaleString() : ''}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
				<ScrollBar orientation="horizontal" />
			</ScrollArea>
		</Widget>
	);
}

export default TripSelection;

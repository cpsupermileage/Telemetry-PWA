import { SpectatorContext } from '@/components/context/SpectatorContextProvider';
import Widget from '@/components/dashboard/Widget';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TripType } from '@/lib/types/TripType';
import useQuery from '@/lib/utils/useQuery';
import { use, useMemo } from 'react';

function TripSelection() {
	const spectator = use(SpectatorContext);

	const trips = useQuery(async (db) => {
		return (await db.getAll('trips')).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
	}, []);

	const currentTripId = useMemo(() => {
		return trips.find(
			(trip) =>
				!trip.endedAt &&
				trip.startedAt &&
				// eslint-disable-next-line react-hooks/purity
				new Date(trip.startedAt).getTime() > Date.now() - 6 * 60 * 60 * 1000
		)?.id;
	}, [trips]);

	return (
		<section className="flex h-full w-full p-2">
			<Widget className="h-full w-full p-2">
				<ScrollArea type="auto" className="h-full w-full min-w-2xl">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>Started At</TableHead>
								<TableHead>Ended At</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{trips.map((trip) => (
								<TableRow
									key={trip.id}
									data-state={spectator?.tripId == trip.id ? 'selected' : false}
									role="button"
									tabIndex={0}
									onClick={() => spectator?.setTripId(trip.id)}
									className="cursor-pointer"
								>
									<TableCell>
										{trip.name}
										{trip.id == currentTripId && (
											<Badge className="ml-2 bg-blue-500 text-white dark:bg-blue-600">Current</Badge>
										)}
									</TableCell>
									<TableCell>
										{
											{
												[TripType.TESTING]: <Badge variant="secondary">Testing</Badge>,
												[TripType.CALIBRATION]: (
													<Badge className="bg-yellow-500 text-white dark:bg-yellow-600">Calibration</Badge>
												),
												[TripType.FULL_RUN]: (
													<Badge className="bg-green-500 text-white dark:bg-green-600">Full Run</Badge>
												),
											}[trip.type]
										}
									</TableCell>
									<TableCell>{trip.startedAt ? new Date(trip.startedAt).toLocaleString() : ''}</TableCell>
									<TableCell>{trip.endedAt ? new Date(trip.endedAt).toLocaleString() : ''}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</ScrollArea>
			</Widget>
		</section>
	);
}

export default TripSelection;

import GoogleMaps from '@/components/dashboard/GoogleMaps';
import Widget from '@/components/dashboard/Widget';
import './DriverView.css';
import { WidgetStatistic } from '@/components/dashboard/WidgetStatistic';
import WidgetSpeedometer from '@/components/dashboard/WidgetSpeedometer';
import { use } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Octagon, Play } from 'lucide-react';
import { DriverContext } from '@/components/context/DriverContextProvider';

function DriverView() {
	const driver = use(DriverContext);

	function startTrip() {
		if (!driver) return toast.error('Function not available');
		driver
			.setTrip({
				...driver.trip,
				startedAt: new Date().toISOString(),
			})
			.catch((err) => {
				console.error(err);
				toast.error('Failed to start trip: ' + (err instanceof Error ? err.message : 'Unknown Error'));
			});
	}

	function stopTrip() {
		if (!driver) return toast.error('Function not available');
		if (driver.trip === undefined) return;
		driver
			.setTrip({
				...driver.trip,
				endedAt: new Date().toISOString(),
			})
			.then(() => driver.setTrip(undefined))
			.catch((err) => {
				console.error(err);
				toast.error('Failed to stop trip: ' + (err instanceof Error ? err.message : 'Unknown Error'));
			});
	}

	return (
		<section id="driver-view" className="grid h-full w-full gap-2 p-2">
			<Widget style={{ gridArea: 'a' }}>
				<WidgetSpeedometer
					value={23}
					min={0}
					max={50}
					smallTickEvery={1}
					largeTickEvery={10}
					className="text-green-500"
					style={{ marginBottom: '-125px' }}
				/>
				<WidgetStatistic value={23.2} unit="mph" delta={0} size="2xl" />
			</Widget>
			<Widget style={{ gridArea: 'b' }}>
				<WidgetStatistic value="15:34" unit="Time Remaining" delta={1} size="lg" className="[small]:mb-2" />
				<WidgetStatistic value="4.6" unit="Miles Remaining" delta={1} size="lg" className="[small]:mb-2" />
			</Widget>
			<Widget style={{ gridArea: 'c' }}>
				<WidgetSpeedometer
					value={2.35}
					min={0}
					max={10}
					smallTickEvery={1}
					largeTickEvery={5}
					className="text-yellow-500"
					style={{ marginBottom: '-125px' }}
				/>
				<WidgetStatistic value={2.35} unit="Mi/KWh" delta={2} size="2xl" />
			</Widget>
			<Widget style={{ gridArea: 'd' }}>
				<WidgetStatistic value={2.42} unit="Average Mi/KWh" delta={2} size="xl" className="[small]:mb-2" />
				<WidgetStatistic value={41.2} unit="Volts" delta={1} size="lg" />
			</Widget>
			<div style={{ gridArea: 'e' }} className="flex flex-col gap-2">
				<Widget className="h-full">
					<GoogleMaps />
				</Widget>
				{driver && (
					<Widget className="p-4">
						{driver.trip ? (
							!driver.trip.startedAt ? (
								<Button onClick={startTrip} className="bg-green-400 !px-8 font-bold hover:bg-green-500">
									<Play /> Start Trip
								</Button>
							) : (
								<Button onClick={stopTrip} className="bg-red-400 !px-8 font-bold hover:bg-red-500">
									<Octagon /> Stop Trip
								</Button>
							)
						) : (
							<div className="text-center text-sm">
								You must define your trip above <br />
								<i>before</i> starting the timer
							</div>
						)}
					</Widget>
				)}
			</div>
		</section>
	);
}

export default DriverView;

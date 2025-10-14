import GoogleMaps from '@/components/dashboard/GoogleMaps';
import Widget from '@/components/dashboard/Widget';
import './DriverView.css';
import { WidgetStatistic } from '@/components/dashboard/WidgetStatistic';
import WidgetSpeedometer from '@/components/dashboard/WidgetSpeedometer';

function DriverView() {
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
				<WidgetStatistic value="15:34" unit="Time Remaining" delta={1} size="xl" className="[small]:mb-2" />
				<WidgetStatistic value="4.6" unit="Miles Remaining" delta={1} size="lg" />
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
			<Widget style={{ gridArea: 'e' }}>
				<GoogleMaps />
			</Widget>
		</section>
	);
}

export default DriverView;

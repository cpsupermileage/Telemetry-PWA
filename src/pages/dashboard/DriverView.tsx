import GoogleMaps from '@/components/dashboard/GoogleMaps';
import Widget from '@/components/dashboard/Widget';
import './DriverView.css';
import { WidgetStatistic } from '@/components/dashboard/WidgetStatistic';

function DriverView() {
	return (
		<section id="driver-view" className="grid h-full w-full gap-2 p-2">
			<Widget style={{ gridArea: 'a' }}>
				<WidgetStatistic value={25} unit="mph" delta={1} size="xl" />
			</Widget>
			<Widget style={{ gridArea: 'b' }}>
				<WidgetStatistic value={25} unit="mph" delta={1} size="xl" />
			</Widget>
			<Widget style={{ gridArea: 'c' }}>
				<WidgetStatistic value={25} unit="mph" delta={1} size="xl" />
			</Widget>
			<Widget style={{ gridArea: 'd' }}>
				<WidgetStatistic value={25} unit="mph" delta={1} size="xl" />
			</Widget>
			<Widget style={{ gridArea: 'e' }}>
				<GoogleMaps />
			</Widget>
		</section>
	);
}

export default DriverView;

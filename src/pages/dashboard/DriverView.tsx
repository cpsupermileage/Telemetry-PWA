import GoogleMaps from '@/components/dashboard/GoogleMaps';
import { Widget } from '@/components/dashboard/Widget';
import './DriverView.css';

function DriverView() {
	return (
		<section id="driver-view" className="grid h-full w-full gap-2 p-2">
			<Widget value={1} unit="mph" size="xl" style={{ gridArea: 'a' }} />
			<Widget value={2} unit="mph" size="xl" delta={0} style={{ gridArea: 'b' }} />
			<Widget value={3} unit="mph" size="xl" delta={1} style={{ gridArea: 'c' }} />
			<Widget value={undefined} unit="mph" size="xl" style={{ gridArea: 'd' }} />
			<div className="h-full w-full overflow-hidden rounded-lg shadow-sm" style={{ gridArea: 'e' }}>
				<GoogleMaps />
			</div>
		</section>
	);
}

export default DriverView;

import { use } from 'react';
import DriverView from './dashboard/DriverView';
import EngineerView from './dashboard/EngineerView';
import TripView from './dashboard/TripView';
import { CommonTelemetryContext } from '@/components/context/CommonTelemetryContextProvider';

function Dashboard() {
	const telemetry = use(CommonTelemetryContext);

	return (
		<main className="mx-auto h-screen max-w-4xl snap-y snap-mandatory overflow-y-scroll">
			<div className="@container h-screen max-h-[600px] w-full snap-center md:max-h-96">
				{telemetry.type === 'driver' ? <TripView /> : <></>}
			</div>
			<div className="@container h-screen max-h-[600px] w-full snap-center md:max-h-96">
				<DriverView />
			</div>
			<div className="@container h-screen max-h-[600px] w-full snap-center md:max-h-96">
				<EngineerView />
			</div>
		</main>
	);
}

export default Dashboard;

import { use } from 'react';
import DriverView from './dashboard/DriverView';
import EngineerView from './dashboard/EngineerView';
import TripView from './dashboard/TripView';
import BluetoothControl from '@/components/dashboard/BluetoothControl';
import Menu from '@/components/dashboard/Menu';
import { DriverContext } from '@/components/context/DriverContextProvider';
import TripSelection from './dashboard/TripSelection';
import SyncErrorBanner from '@/components/dashboard/SyncErrorBanner';

function Dashboard() {
	const driver = use(DriverContext);

	return (
		<main className="relative mx-auto h-screen max-w-4xl snap-y snap-mandatory overflow-y-scroll">
			<div className="@container h-screen max-h-[600px] w-full snap-center md:max-h-96">
				{driver !== undefined ? <TripView /> : <TripSelection />}
			</div>
			<div className="@container h-screen max-h-[600px] w-full snap-center md:max-h-96">
				<DriverView />
			</div>
			<div className="@container h-screen max-h-[600px] w-full snap-center md:max-h-96">
				<EngineerView />
			</div>
			<div className="fixed top-2 left-2">
				<Menu />
			</div>
			{driver !== undefined && (
				<div className="fixed top-2 right-2">
					<BluetoothControl />
				</div>
			)}
			<SyncErrorBanner ignoreDownstream={driver !== undefined} />
		</main>
	);
}

export default Dashboard;

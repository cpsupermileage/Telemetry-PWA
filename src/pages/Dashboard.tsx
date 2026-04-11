import { use } from 'react';
import DriverView from './dashboard/DriverView';
import EngineerView from './dashboard/EngineerView';
import TripView from './dashboard/TripView';
import BluetoothControl from '@/components/dashboard/BluetoothControl';
import { DriverContext } from '@/components/context/DriverContextProvider';
import SyncErrorBanner from '@/components/dashboard/SyncErrorBanner';
import { Link } from 'react-router';
import Widget from '@/components/dashboard/Widget';
import { Menu } from 'lucide-react';

function Dashboard() {
	const driver = use(DriverContext);

	return (
		<main className="relative mx-auto h-screen max-w-4xl snap-y snap-mandatory overflow-y-scroll">
			{driver !== undefined && (
				<div className="@container h-screen max-h-[800px] w-full snap-center md:max-h-96">
					<TripView />
				</div>
			)}
			<div className="@container h-screen max-h-[800px] w-full snap-center md:max-h-96">
				<DriverView />
			</div>
			<div className="@container h-screen max-h-[800px] w-full snap-center md:max-h-96">
				<EngineerView />
			</div>
			<div className="fixed top-2 left-2">
				<Link to="/">
					<Widget className="p-2">
						<Menu />
					</Widget>
				</Link>
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

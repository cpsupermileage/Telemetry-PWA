import DriverView from './dashboard/DriverView';

function Dashboard() {
	return (
		<main className="mx-auto h-screen max-w-4xl snap-y snap-mandatory overflow-y-scroll">
			<div className="h-screen max-h-96 w-full snap-center">
				<DriverView />
			</div>
		</main>
	);
}

export default Dashboard;

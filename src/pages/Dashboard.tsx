import DriverView from './dashboard/DriverView';

function Dashboard() {
	return (
		<main className="mx-auto h-screen max-w-4xl snap-y snap-mandatory overflow-y-scroll">
			<div className="@container h-screen max-h-[500px] w-full snap-center md:max-h-96">
				<DriverView />
			</div>
		</main>
	);
}

export default Dashboard;

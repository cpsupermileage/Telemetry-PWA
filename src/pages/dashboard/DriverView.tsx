import GoogleMaps from '@/components/dashboard/GoogleMaps';

function DriverView() {
	return (
		<section className="@container flex h-full w-full flex-col p-4 @sm:flex-row">
			<div className="h-full w-2/3 overflow-hidden rounded-lg">
				<GoogleMaps />
			</div>
		</section>
	);
}

export default DriverView;

import { CommonTelemetryContext } from '@/components/context/CommonTelemetryContextProvider';
import Widget from '@/components/dashboard/Widget';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { TripType } from '@/lib/types/TripType';
import useLocalStorageState from '@/lib/utils/useLocalStorageState';
import { use, useMemo, useState } from 'react';
import { toast } from 'sonner';

function TripView() {
	const telemetry = use(CommonTelemetryContext);

	const [name, setName] = useState('');
	const [tripType, setTripType] = useLocalStorageState('tripType', TripType.TESTING);

	const placeholder = useMemo(
		() => TripType[tripType] + ' ' + new Date().toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }),
		[tripType]
	);

	function createTrip() {
		if (!telemetry.setDriverTrip) return toast.error('Function not available');

		telemetry
			.setDriverTrip({
				name: name || placeholder,
				type: tripType,
				createdAt: new Date(),
			})
			.catch((err) => {
				console.error(err);
				toast.error('Failed to create trip: ' + (err instanceof Error ? err.message : 'Unknown Error'));
			});
	}

	function resetTrip() {
		if (!telemetry.setDriverTrip) return toast.error('Function not available');
		void telemetry.setDriverTrip(undefined);
	}

	return (
		<section className="flex h-full w-full flex-col items-center justify-center p-2">
			<Widget className="w-full max-w-md gap-4 p-6">
				<div className="w-full">
					<Label htmlFor="tripName" className="mb-2">
						Trip Name
					</Label>
					<Input
						disabled={!!telemetry.trip}
						value={name}
						onChange={(e) => setName(e.target.value)}
						id="tripName"
						placeholder={placeholder}
						className="w-full"
					/>
				</div>
				<RadioGroup
					disabled={!!telemetry.trip}
					value={tripType + ''}
					onValueChange={(val) => setTripType(parseInt(val))}
					className="flex flex-wrap gap-2"
				>
					<Label className={buttonVariants({ variant: 'outline', className: 'flex items-center gap-3' })}>
						<RadioGroupItem value={TripType.TESTING + ''} id="r1" />
						<span>Testing</span>
					</Label>
					<Label className={buttonVariants({ variant: 'outline', className: 'flex items-center gap-3' })}>
						<RadioGroupItem value={TripType.CALIBRATION + ''} id="r1" />
						<span>Calibration</span>
					</Label>
					<Label className={buttonVariants({ variant: 'outline', className: 'flex items-center gap-3' })}>
						<RadioGroupItem value={TripType.FULL_RUN + ''} id="r1" />
						<span>Full Run</span>
					</Label>
				</RadioGroup>
				<Separator />
				<div className="flex gap-4">
					{!telemetry.trip ? (
						<Button onClick={createTrip}>Create Trip</Button>
					) : (
						<Button onClick={resetTrip} variant="secondary">
							Reset For Next Trip
						</Button>
					)}
				</div>
			</Widget>
		</section>
	);
}

export default TripView;

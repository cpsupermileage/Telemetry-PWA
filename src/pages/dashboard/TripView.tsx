import Widget from '@/components/dashboard/Widget';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { TripType } from '@/lib/types/TripType';
import useLocalStorageState from '@/lib/utils/useLocalStorageState';
import { useMemo, useState } from 'react';

function TripView() {
	const [name, setName] = useState('');
	const [tripType, setTripType] = useLocalStorageState('tripType', TripType.TESTING);

	const placeholder = useMemo(
		() => TripType[tripType] + ' ' + new Date().toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }),
		[tripType]
	);

	return (
		<section className="flex h-full w-full flex-col items-center justify-center p-2">
			<Widget className="w-full max-w-md gap-4 p-6">
				<div className="w-full">
					<Label htmlFor="tripName" className="mb-2">
						Trip Name
					</Label>
					<Input
						value={name}
						onChange={(e) => setName(e.target.value)}
						id="tripName"
						placeholder={placeholder}
						className="w-full"
					/>
				</div>
				<RadioGroup
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
			</Widget>
		</section>
	);
}

export default TripView;

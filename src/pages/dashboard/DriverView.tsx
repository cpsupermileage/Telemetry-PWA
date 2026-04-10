import GoogleMaps from '@/components/dashboard/GoogleMaps';
import Widget from '@/components/dashboard/Widget';
import './DriverView.css';
import { WidgetStatistic } from '@/components/dashboard/WidgetStatistic';
import WidgetSpeedometer from '@/components/dashboard/WidgetSpeedometer';
import { use, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AlertCircleIcon, Octagon, Play } from 'lucide-react';
import { DriverContext } from '@/components/context/DriverContextProvider';
import useQuery from '@/lib/hooks/useQuery';
import { MOTOR_STEPS, RACE_LENGTH_MILES, RACE_TIME_MILLIS, WHEEL_RADIUS_METERS } from '@/constants';
import type { TelemetryRow } from '@/lib/types/TelemetryRow';
import dayjs from '@/lib/utils/dayjs';
import { SpectatorContext } from '@/components/context/SpectatorContextProvider';
import ControlledGoogleMaps from '@/components/dashboard/ControlledGoogleMaps';
import type { MapCameraProps } from '@vis.gl/react-google-maps';
import { MC_FAULT_CODE } from '@/lib/types/CarState';
import SpectatorControls from '@/components/dashboard/SpectatorControls';

function DriverView() {
	const driver = use(DriverContext);
	const spectator = use(SpectatorContext);

	function startTrip() {
		if (driver !== undefined) {
			if (driver.trip === undefined) return;
			driver
				.setTrip({
					...driver.trip,
					startedAt: Date.now(),
				})
				.catch((err) => {
					console.error(err);
					toast.error('Failed to start trip: ' + (err instanceof Error ? err.message : 'Unknown Error'));
				});
		} else if (spectator !== undefined) {
			if (spectator.trip === undefined) return;
			spectator
				.updateTrip({
					...spectator.trip,
					startedAt: Date.now(),
				})
				.catch((err) => {
					console.error(err);
					toast.error('Failed to start trip: ' + (err instanceof Error ? err.message : 'Unknown Error'));
				});
		} else return toast.error('Function not available');
	}

	function stopTrip() {
		if (driver !== undefined) {
			if (driver.trip === undefined) return;
			driver
				.setTrip({
					...driver.trip,
					endedAt: Date.now(),
				})
				.then(() => driver.setTrip(undefined))
				.catch((err) => {
					console.error(err);
					toast.error('Failed to stop trip: ' + (err instanceof Error ? err.message : 'Unknown Error'));
				});
		} else if (spectator !== undefined) {
			if (spectator.trip === undefined) return;
			spectator
				.updateTrip({
					...spectator.trip,
					endedAt: Date.now(),
				})
				.catch((err) => {
					console.error(err);
					toast.error('Failed to stop trip: ' + (err instanceof Error ? err.message : 'Unknown Error'));
				});
		} else return toast.error('Function not available');
	}

	const trip = useMemo(() => driver?.trip ?? spectator?.trip, [driver?.trip, spectator?.trip]);

	const [carData, prevCarData, firstCarData] = useQuery<
		[TelemetryRow | undefined, TelemetryRow | undefined, TelemetryRow | undefined]
	>(
		useCallback(
			async (db) => {
				if (!trip) return [undefined, undefined, undefined];
				const tx = db.transaction(['telemetry', 'trips'], 'readonly');

				// Gets the most recent entry
				let cursor = await tx
					.objectStore('telemetry')
					.index('by-tripId-time')
					.openCursor(IDBKeyRange.bound([trip.id, 0], [trip.id, spectator?.time ?? Number.MAX_SAFE_INTEGER]), 'prev');
				const current = cursor?.value;
				// Gets the 8th most recent entry
				cursor = (await cursor?.advance(8)) ?? null;
				const prev = cursor?.value;
				// Gets the first entry after the trip started
				let first: TelemetryRow | undefined;
				if (trip?.startedAt && (spectator?.time == undefined || trip.startedAt <= spectator.time)) {
					cursor = await tx
						.objectStore('telemetry')
						.index('by-tripId-time')
						.openCursor(
							IDBKeyRange.bound([trip.id, trip.startedAt], [trip.id, spectator?.time ?? Number.MAX_SAFE_INTEGER]),
							'next'
						);
					first = cursor?.value;
				} else {
					first = undefined;
				}

				await tx.done;
				return [current, prev, first];
			},
			[trip, spectator]
		),
		[undefined, undefined, undefined]
	);

	console.log(carData, prevCarData, firstCarData);

	const rpm = useMemo(() => {
		if (!carData || !prevCarData) return;
		if (carData.tacho == null || prevCarData.tacho == null) return;
		return (carData.tacho - prevCarData.tacho) / ((carData.time - prevCarData.time) / 1000 / 60);
	}, [carData, prevCarData]);

	const speedMPH = useMemo(() => {
		if (!rpm) return undefined;
		const d = rpm * 2 * Math.PI * WHEEL_RADIUS_METERS; // Meters per minute
		return d / 1609 / 60; // Convert to miles per hour
	}, [carData]);

	const timeRemaining = useMemo(() => {
		if (!carData || !trip?.startedAt) return undefined;
		if (carData.time < trip.startedAt) return undefined;
		// How long since the trip has started
		const dt = +dayjs(carData.time) - +dayjs(trip.startedAt);
		const millis = RACE_TIME_MILLIS - dt;
		const m = Math.floor(millis / 1000 / 60) + '';
		const s = Math.abs(Math.floor(millis / 1000) % 60) + '';
		return `${m}:${s.padStart(2, '0')}`;
	}, [carData, trip]);

	const milesRemaining = useMemo(() => {
		if (!carData || !firstCarData) return undefined;
		if (carData.tacho == null || firstCarData.tacho == null) return undefined;

		const dRev = (carData.tacho - firstCarData.tacho) / MOTOR_STEPS; // Amount of wheel revolutions traveled
		const dMiles = (dRev * 2 * Math.PI * WHEEL_RADIUS_METERS) / 1609; // Distance traveled miles

		return RACE_LENGTH_MILES - dMiles;
	}, [carData, firstCarData]);

	const efficiency = useMemo(() => {
		if (!carData || !prevCarData) return;
		if (
			carData.wattHours == null ||
			prevCarData.wattHours == null ||
			carData.tacho == null ||
			prevCarData.tacho == null
		)
			return;

		const dRev = (carData.tacho - prevCarData.tacho) / MOTOR_STEPS; // Amount of wheel revolutions traveled
		const dMiles = (dRev * 2 * Math.PI * WHEEL_RADIUS_METERS) / 1609; // Distance traveled miles

		const dWH = (carData.wattHours - prevCarData.wattHours) / 1000; // KiloWatt hours used since last entry

		return dWH > 0 ? dMiles / dWH : 0;
	}, [carData, prevCarData]);

	const avgEfficiency = useMemo(() => {
		if (!carData || !firstCarData) return;
		if (
			carData.wattHours == null ||
			firstCarData.wattHours == null ||
			carData.tacho == null ||
			firstCarData.tacho == null
		)
			return;

		const dRev = (carData.tacho - firstCarData.tacho) / MOTOR_STEPS; // Amount of wheel revolutions traveled
		const dMiles = (dRev * 2 * Math.PI * WHEEL_RADIUS_METERS) / 1609; // Distance traveled miles

		const dWH = (carData.wattHours - firstCarData.wattHours) / 1000; // KiloWatt hours used since last entry

		return dWH > 0 ? dMiles / dWH : 0;
	}, [carData, firstCarData]);

	const cameraProps = useMemo<Partial<MapCameraProps> | undefined>(() => {
		if (!spectator) return;
		if (!carData?.lat || !carData.long) return;

		return {
			center: {
				lat: carData.lat,
				lng: carData.long,
			},
			heading: carData.heading ?? undefined,
		};
	}, [spectator, carData]);

	return (
		<section id="driver-view" className="relative grid h-full w-full gap-2 p-2">
			<Widget style={{ gridArea: 'a' }}>
				<WidgetSpeedometer
					value={speedMPH ?? 0}
					min={0}
					max={50}
					smallTickEvery={1}
					largeTickEvery={10}
					className="text-green-500"
					style={{ marginBottom: '-125px' }}
				/>
				<WidgetStatistic value={speedMPH} unit="MPH" delta={0} size="2xl" />
			</Widget>
			<Widget style={{ gridArea: 'b' }}>
				<WidgetStatistic value={timeRemaining} unit="Time Remaining" delta={1} size="lg" className="[small]:mb-2" />
				<WidgetStatistic value={milesRemaining} unit="Miles Remaining" delta={1} size="lg" className="[small]:mb-2" />
			</Widget>
			<Widget style={{ gridArea: 'c' }}>
				<WidgetSpeedometer
					value={avgEfficiency ?? 0}
					min={0}
					max={200}
					smallTickEvery={5}
					largeTickEvery={25}
					className="text-yellow-500"
					style={{ marginBottom: '-125px' }}
				/>
				<WidgetStatistic value={avgEfficiency} unit="Avg Mi/KWh" delta={2} size="2xl" />
			</Widget>
			<Widget style={{ gridArea: 'd' }}>
				<WidgetStatistic value={efficiency} unit="Current Mi/KWh" delta={2} size="xl" className="[small]:mb-2" />
				<WidgetStatistic value={carData?.volts} unit="Volts" delta={1} size="lg" />
			</Widget>
			<div style={{ gridArea: 'e' }} className="relative flex flex-col gap-2">
				<Widget className="h-full w-full">
					{driver ? (
						// This one gets the location from the device position instead, and reports back to DriverContext
						<GoogleMaps />
					) : (
						<ControlledGoogleMaps defaultZoom={18} defaultTilt={45} {...cameraProps} />
					)}
				</Widget>
				{(driver ?? (spectator && !spectator.trip?.endedAt)) && (
					<Widget className="p-4">
						{(driver ?? spectator)?.trip ? (
							!(driver ?? spectator)!.trip!.startedAt ? (
								<Button onClick={startTrip} className="bg-green-400 px-8! font-bold hover:bg-green-500">
									<Play /> Start Trip
								</Button>
							) : (
								<Button onClick={stopTrip} className="bg-red-400 px-8! font-bold hover:bg-red-500">
									<Octagon /> Stop Trip
								</Button>
							)
						) : (
							<div className="text-center text-sm">
								You must define your trip above <br />
								<i>before</i> starting the timer
							</div>
						)}
					</Widget>
				)}
				{spectator && <SpectatorControls />}
				{carData && carData?.error !== null && carData.error != MC_FAULT_CODE.NONE && (
					<div className="absolute top-0 w-full">
						<div className="bg-destructive text-primary-foreground flex w-full justify-center gap-2 rounded-lg px-4 py-2 text-sm">
							<AlertCircleIcon className="size-5" />
							<span>
								Motor Controller Fault:{' '}
								<code>
									<b>{MC_FAULT_CODE[carData.error] || 'UNKNOWN'}</b>
								</code>
							</span>
						</div>
					</div>
				)}
			</div>
		</section>
	);
}

export default DriverView;

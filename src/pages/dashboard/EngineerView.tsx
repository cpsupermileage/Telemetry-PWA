import { DriverContext } from '@/components/context/DriverContextProvider';
import { SpectatorContext } from '@/components/context/SpectatorContextProvider';
import Widget from '@/components/dashboard/Widget';
import { WidgetStatistic } from '@/components/dashboard/WidgetStatistic';
import { MOTOR_STEPS, WHEEL_RADIUS_METERS } from '@/constants';
import type { TelemetryRow } from '@/lib/types/TelemetryRow';
import useQuery from '@/lib/hooks/useQuery';
import { BatteryFull, Cog, Cpu, Disc2 } from 'lucide-react';
import { use, useCallback, useMemo } from 'react';

function EngineerView() {
	const driver = use(DriverContext);
	const spectator = use(SpectatorContext);

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
				if (trip?.startedAt && (spectator?.time === undefined || trip.startedAt <= spectator.time)) {
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

	const rpm = useMemo(() => {
		if (!carData || !prevCarData) return;
		if (carData.tacho == null || prevCarData.tacho == null) return;
		return (carData.tacho - prevCarData.tacho) / ((carData.time - prevCarData.time) / (1000 * 60));
	}, [carData, prevCarData]);

	const speedMPH = useMemo(() => {
		if (!rpm) return undefined;
		const d = rpm * 2 * Math.PI * WHEEL_RADIUS_METERS; // Meters per minute
		return d / (1609 / 60); // Convert to miles per hour
	}, [rpm]);

	const milesTraveled = useMemo(() => {
		if (!carData || !firstCarData) return undefined;
		if (carData.tacho == null || firstCarData.tacho == null) return undefined;

		const dRev = (carData.tacho - firstCarData.tacho) / MOTOR_STEPS; // Amount of wheel revolutions traveled
		return (dRev * 2 * Math.PI * WHEEL_RADIUS_METERS) / 1609; // Distance traveled miles
	}, [carData, firstCarData]);

	return (
		<section className="grid h-full w-full grid-cols-2 gap-2 p-2 @md:grid-cols-4">
			<Widget className="justify-start">
				<BatteryFull size={64} className="my-6" />
				<WidgetStatistic value={carData?.volts} unit="Volts" delta={1} size="xl" />
			</Widget>
			<Widget className="justify-start">
				<Cpu size={64} className="my-6" />
				<WidgetStatistic
					value={carData?.dutyCycle ? Math.round(carData?.dutyCycle * 100) : undefined}
					suffix="%"
					unit="Duty Cycle"
					size="xl"
					className="[small]:mb-2"
				/>
				<WidgetStatistic value={carData?.inputCurrent} unit="Amp Input" delta={1} size="lg" className="[small]:mb-2" />
				<WidgetStatistic value={carData?.tempMosfet} suffix="℃" unit="MOSFET Temp" size="lg" />
			</Widget>
			<Widget className="justify-start">
				<Cog size={64} className="my-6" />
				<WidgetStatistic value={rpm} unit="RPM" size="xl" className="[small]:mb-2" />
				<WidgetStatistic value={carData?.motorCurrent} unit="Motor Amps" size="lg" className="[small]:mb-2" />
				<WidgetStatistic value={carData?.tempMotor} suffix="℃" unit="Motor Temp" size="lg" />
			</Widget>
			<Widget className="justify-start">
				<Disc2 size={64} className="my-6" />
				<WidgetStatistic value={speedMPH} unit="MPH" delta={1} size="lg" className="[small]:mb-2" />
				<WidgetStatistic value={milesTraveled} unit="Miles" delta={3} size="lg" />
			</Widget>
		</section>
	);
}

export default EngineerView;

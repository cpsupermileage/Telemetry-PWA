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

	const tripId = useMemo(() => driver?.trip?.id ?? spectator?.tripId, [driver?.trip?.id, spectator?.tripId]);

	const [carData, firstCarData] = useQuery(
		useCallback(
			async (db) => {
				if (!tripId) return [undefined, undefined];
				const tx = db.transaction(['telemetry', 'trips'], 'readonly');

				// Gets the most recent entry
				let cursor = await tx
					.objectStore('telemetry')
					.index('by-tripId-time')
					.openCursor(IDBKeyRange.bound([tripId, 0], [tripId, spectator?.time ?? Number.MAX_SAFE_INTEGER]), 'prev');
				const current = cursor?.value;
				// Gets the first entry after the trip started
				const trip = await tx.objectStore('trips').index('by-id').get(tripId);
				let first: TelemetryRow | undefined;
				if (trip?.startedAt && (spectator?.time === undefined || trip.startedAt <= spectator?.time)) {
					cursor = await tx
						.objectStore('telemetry')
						.index('by-tripId-time')
						.openCursor(
							IDBKeyRange.bound([tripId, trip.startedAt], [tripId, spectator?.time ?? Number.MAX_SAFE_INTEGER]),
							'next'
						);
					first = cursor?.value;
				} else {
					first = undefined;
				}

				await tx.done;
				return [current, first];
			},
			[tripId, spectator?.time]
		),
		[undefined, undefined]
	);

	const speedMPH = useMemo(() => {
		if (!carData?.rpm) return undefined;
		const d = carData.rpm * 2 * Math.PI * WHEEL_RADIUS_METERS; // Meters per minute
		return d / 1609 / 60; // Convert to miles per hour
	}, [carData]);

	const milesTraveled = useMemo(() => {
		if (!carData?.tacho || !firstCarData?.tacho) return undefined;

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
				<WidgetStatistic value={carData?.rpm} unit="RPM" size="xl" className="[small]:mb-2" />
				<WidgetStatistic value={carData?.motorCurrent} unit="Motor Amps" size="lg" className="[small]:mb-2" />
				<WidgetStatistic value={carData?.tempMotor} suffix="℃" unit="Motor Temp" size="lg" />
			</Widget>
			<Widget className="justify-start">
				<Disc2 size={64} className="my-6" />
				<WidgetStatistic value={speedMPH} unit="MPH" delta={1} size="lg" className="[small]:mb-2" />
				<WidgetStatistic value={milesTraveled} unit="Miles" delta={2} size="lg" />
			</Widget>
		</section>
	);
}

export default EngineerView;

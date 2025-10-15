import Widget from '@/components/dashboard/Widget';
import { WidgetStatistic } from '@/components/dashboard/WidgetStatistic';
import { BatteryFull, Cog, Cpu, Disc2 } from 'lucide-react';

function EngineerView() {
	return (
		<section className="grid h-full w-full grid-cols-2 gap-2 p-2 @md:grid-cols-4">
			<Widget className="justify-start">
				<BatteryFull size={64} className="my-6" />
				<WidgetStatistic value={41.2} unit="Volts" delta={1} size="xl" />
			</Widget>
			<Widget className="justify-start">
				<Cpu size={64} className="my-6" />
				<WidgetStatistic value="48%" unit="Duty Cycle" size="xl" className="[small]:mb-2" />
				<WidgetStatistic value="2.5" unit="Amp Input" delta={1} size="lg" className="[small]:mb-2" />
				<WidgetStatistic value="24℃" unit="Temp" size="lg" />
			</Widget>
			<Widget className="justify-start">
				<Cog size={64} className="my-6" />
				<WidgetStatistic value="4251" unit="RPM" size="xl" className="[small]:mb-2" />
				<WidgetStatistic value="2.4" unit="Amp Input" size="lg" className="[small]:mb-2" />
				<WidgetStatistic value="26℃" unit="Temp" size="lg" />
			</Widget>
			<Widget className="justify-start">
				<Disc2 size={64} className="my-6" />
				<WidgetStatistic value={4251} unit="RPM" delta={0} size="xl" className="[small]:mb-2" />
				<WidgetStatistic value={23.3} unit="mph" delta={1} size="lg" />
			</Widget>
		</section>
	);
}

export default EngineerView;

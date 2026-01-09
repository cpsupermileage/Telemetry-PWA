import { use } from 'react';
import { SpectatorContext } from '../context/SpectatorContextProvider';
import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { Slider } from '../ui/slider';
import Widget from './Widget';

function SpectatorControls() {
	const spectator = use(SpectatorContext);

	if (!spectator) throw new Error('Spectator Context not defined');

	return (
		<Widget className="flex-row gap-2 p-2">
			<button
				type="button"
				disabled={spectator.time === undefined}
				onClick={() => spectator.skip(-5000)}
				className="cursor-pointer transition hover:opacity-80"
			>
				<SkipBack size={20} />
			</button>
			<button
				type="button"
				onClick={() => spectator.setPaused(!spectator.paused)}
				className="cursor-pointer transition hover:opacity-80"
			>
				{spectator.paused ? <Play size={20} /> : <Pause size={20} />}
			</button>
			<button
				type="button"
				disabled={spectator.time === undefined}
				onClick={() => spectator.skip(5000)}
				className="cursor-pointer transition hover:opacity-80"
			>
				<SkipForward size={20} />
			</button>
			<div className="w-full px-2">
				<Slider
					value={[spectator.time ?? spectator.maxTime ?? 0]}
					min={spectator.minTime ?? 0}
					max={spectator.maxTime ?? 0}
					step={1}
				/>
			</div>
			{spectator.isLive && (
				<button
					type="button"
					onClick={() => spectator.setTime(undefined)}
					className="text-card-foreground cursor-pointer rounded-md bg-red-500/75 px-2 py-1 text-xs font-bold transition hover:bg-red-500/50"
				>
					Live
				</button>
			)}
		</Widget>
	);
}

export default SpectatorControls;

import { use } from 'react';
import { SpectatorContext } from '../context/SpectatorContextProvider';
import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { Slider } from '../ui/slider';
import Widget from './Widget';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Kbd } from '../ui/kbd';
import useKeyDown from '@/lib/hooks/useKeyDown';

function SpectatorControls() {
	const spectator = use(SpectatorContext);

	if (!spectator) throw new Error('Spectator Context not defined');

	useKeyDown(['ArrowLeft'], () => spectator.skip(-5000));
	useKeyDown(['ArrowRight'], () => spectator.skip(5000));
	useKeyDown([' '], () => spectator.setPaused(!spectator.paused));

	return (
		<Widget className="flex-row gap-2 p-2">
			<Tooltip>
				<TooltipTrigger asChild>
					<button
						type="button"
						disabled={spectator.time === undefined}
						onClick={() => spectator.skip(-5000)}
						className="cursor-pointer transition hover:opacity-80"
					>
						<SkipBack size={20} />
					</button>
				</TooltipTrigger>
				<TooltipContent>
					<p>
						Back 5 seconds <Kbd>&larr;</Kbd>
					</p>
				</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger asChild>
					<button
						type="button"
						onClick={() => spectator.setPaused(!spectator.paused)}
						className="cursor-pointer transition hover:opacity-80"
					>
						{spectator.paused ? <Play size={20} /> : <Pause size={20} />}
					</button>
				</TooltipTrigger>
				<TooltipContent>
					<p>
						Pause/Play <Kbd>Space</Kbd>
					</p>
				</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger asChild>
					<button
						type="button"
						disabled={spectator.time === undefined}
						onClick={() => spectator.skip(5000)}
						className="cursor-pointer transition hover:opacity-80"
					>
						<SkipForward size={20} />
					</button>
				</TooltipTrigger>
				<TooltipContent>
					<p>
						Forward 5 seconds <Kbd>&rarr;</Kbd>
					</p>
				</TooltipContent>
			</Tooltip>
			<div className="w-full px-2">
				<Slider
					value={[spectator.time ?? spectator.maxTime ?? 0]}
					onValueChange={(val) => {
						spectator.setTime(val[0]);
						spectator.setPaused(true);
					}}
					min={spectator.minTime ?? 0}
					max={spectator.maxTime ?? 0}
					step={1}
				/>
			</div>
			{spectator.isLive && (
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							onClick={() => spectator.setTime(undefined)}
							className="text-card-foreground cursor-pointer rounded-md bg-red-500/75 px-2 py-1 text-xs font-bold transition hover:bg-red-500/50"
						>
							Live
						</button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Resume Live Playback</p>
					</TooltipContent>
				</Tooltip>
			)}
		</Widget>
	);
}

export default SpectatorControls;

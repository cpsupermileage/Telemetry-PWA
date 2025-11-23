import { use } from 'react';
import { SpectatorContext } from '../context/SpectatorContextProvider';
import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';

function SpectatorControls() {
	const spectator = use(SpectatorContext);

	if (!spectator) throw new Error('Spectator Context not defined');

	<div className="fixed bottom-0 m-2 flex w-full gap-2 overflow-hidden rounded-lg bg-black/50 p-1 shadow-sm">
		<button
			type="button"
			disabled={spectator.time === undefined}
			onClick={() => spectator.time && spectator.setTime(spectator.time - 5000)}
		>
			<SkipBack />
		</button>
		<button type="button" onClick={() => spectator.setPaused((value) => !value)}>
			{spectator.paused ? <Play /> : <Pause />}
		</button>
		<button
			type="button"
			disabled={spectator.time === undefined}
			onClick={() => spectator.time && spectator.setTime(spectator.time + 5000)}
		>
			<SkipForward />
		</button>
	</div>;
}

export default SpectatorControls;

import { use, useEffect, useState } from 'react';
import { TelemetryContext } from '../context/TelemetryContextProvider';

function SyncErrorBanner({ ignoreDownstream = false }: { ignoreDownstream?: boolean }) {
	const telemetry = use(TelemetryContext);

	const [downstreamSyncError, setDownstreamSyncError] = useState<boolean>(false);
	const [upstreamSyncError, setUpstreamSyncError] = useState<boolean>(false);

	useEffect(() => {
		telemetry.events.on('downstreamSyncError', setDownstreamSyncError);
		return () => void telemetry.events.off('downstreamSyncError', setDownstreamSyncError);
	}, [telemetry]);

	useEffect(() => {
		telemetry.events.on('upstreamSyncError', setUpstreamSyncError);
		return () => void telemetry.events.off('upstreamSyncError', setUpstreamSyncError);
	}, [telemetry]);

	if ((!ignoreDownstream && downstreamSyncError) || upstreamSyncError)
		return (
			<div className="text-primary-foreground fixed right-0 bottom-0 left-0 z-30 bg-yellow-400 px-2 text-center text-xs">
				Cannot connect to server
			</div>
		);
}

export default SyncErrorBanner;

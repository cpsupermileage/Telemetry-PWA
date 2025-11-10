import { createContext, use, useState } from 'react';
import { TelemetryContext } from './TelemetryContextProvider';

/**
 * The data type that the context provides
 */
export interface SpectatorContextType {
	tripId: number | undefined;
	setTripId: (tripId: number | undefined) => void;
}

/**
 * A wrapper for providing the SpectatorTelemetryContext values to its children.
 */
export default function SpectatorTelemetryContextProvider({ children }: { children: React.ReactNode }) {
	const { setSyncTelemetryTripId } = use(TelemetryContext);

	const [tripId, _setTripId] = useState<number | undefined>(undefined);

	function setTripId(tripId: number | undefined) {
		_setTripId(tripId);
		// Also made sure we start downloading the associated telemetry entries
		setSyncTelemetryTripId(tripId);
	}

	// Returning the value
	const value = {
		tripId,
		setTripId,
	} satisfies SpectatorContextType;

	return <SpectatorContext value={value}>{children}</SpectatorContext>;
}

/**
 * Access the data that the SpectatorContext provides
 * @example ```js
 * const { tripId } = useContext(SpectatorContext);
 * ```
 */
export const SpectatorContext = createContext<SpectatorContextType | undefined>(undefined);

import { createContext, useState } from 'react';

/**
 * The data type that the context provides
 */
export interface SpectatorContextType {
	tripId: number | undefined;
	setTripId: React.Dispatch<React.SetStateAction<number | undefined>>;
}

/**
 * A wrapper for providing the SpectatorTelemetryContext values to its children.
 */
export default function SpectatorTelemetryContextProvider({ children }: { children: React.ReactNode }) {
	const [tripId, setTripId] = useState<number | undefined>(undefined);

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

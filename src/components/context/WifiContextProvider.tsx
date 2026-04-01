import { createContext, useEffect, useRef } from 'react';
import EventEmitter from 'eventemitter3';
import type { CarState } from '../../lib/types/CarState';

export const ESP32_IP_ADDRESS = '192.168.4.8';

export type WiFiStatus = 'disconnected' | 'connected';
export type CharacteristicKeys = keyof CarState;

interface WiFiEventMap {
	// Whenever the status of the bluetooth connection is changed
	status: (status: WiFiStatus) => void;
}

/**
 * The data that the BluetoothContext provides
 * @see WiFiContext
 */
export interface WiFiContextType {
	/**
	 * Events about the status of the connection and updating of data
	 */
	events: EventEmitter<WiFiEventMap>;
	/**
	 * @returns The current status of the wifi connection
	 */
	getStatus: () => WiFiStatus;
}

/**
 * Access the data that the WiFiContext provides
 * @example ```js
 * const { events } = useContext(WiFiContext);
 * ```
 */
export const WiFiContext = createContext<WiFiContextType | undefined>(undefined);

/**
 * A wrapper for providing the WiFiContext values to its children.
 */
export default function WiFiContextProvider({ children }: { children: React.ReactNode }) {
	const status = useRef<WiFiStatus>('disconnected');
	const events = useRef(new EventEmitter<WiFiEventMap>());

	// Returns the status of the connection
	function getStatus() {
		return status.current;
	}

	useEffect(() => {
		const interval = setInterval(() => {
			fetch(`http://${ESP32_IP_ADDRESS}/`, {
				method: 'GET',
				signal: AbortSignal.timeout(1000),
			})
				.then((res) => {
					if (res.ok && status.current !== 'connected') {
						status.current = 'connected';
						events.current.emit('status', 'connected');
					} else if (!res.ok) throw new Error();
				})
				.catch(() => {
					if (status.current !== 'disconnected') {
						status.current = 'disconnected';
						events.current.emit('status', 'disconnected');
					}
				});
		}, 1000);
		return () => clearInterval(interval);
	}, []);

	const value = {
		// eslint-disable-next-line react-hooks/refs
		events: events.current,
		getStatus,
	};

	// eslint-disable-next-line react-hooks/refs
	return <WiFiContext value={value}>{children}</WiFiContext>;
}

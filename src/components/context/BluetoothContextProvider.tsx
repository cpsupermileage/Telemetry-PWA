import cachedAsyncFunction from '@/lib/utils/cachedAsyncFunction';
import { createContext, useEffect, useRef } from 'react';
import EventEmitter from 'eventemitter3';
import type { CarState } from '../../lib/types/CarState';

// Bluetooth Config
const SERVICE_UUID = '8e1dfb38-f3a5-4b3f-8f99-a30c0f61fc4e';
const CHARACTERISTIC_UUIDS: Record<CharacteristicKeys, BluetoothCharacteristicUUID> = {
	// Some characteristic types have assigned numbers in the BLE spec, see here:
	// https://www.bluetooth.com/wp-content/uploads/Files/Specification/HTML/Assigned_Numbers/out/en/Assigned_Numbers.pdf
	tempMosfet: 0x2a1e, // Intermediate Temperature (the name in the BLE spec)
	tempMotor: 0x2a1c, // Temperature Measurement
	motorCurrent: 0x2aee, // Electric Current
	inputCurrent: 0x2ae0, // Average Current
	dutyCycle: 0x2c10, // Work Cycle Data
	tacho: 0x2c09, // Rotational Speed
	rpm: 0x2a67, // Location and Speed
	volts: 0x2b18, // Voltage
	wattHours: 0x2af2, // Energy
	error: 0x2bbb, // Status flags
};

const CHARACTERISTIC_DECODE_FUNCTIONS: Record<CharacteristicKeys, (data: DataView) => number> = {
	tempMosfet: (data) => data.getFloat32(0, true),
	tempMotor: (data) => data.getFloat32(0, true),
	motorCurrent: (data) => data.getFloat32(0, true),
	inputCurrent: (data) => data.getFloat32(0, true),
	dutyCycle: (data) => data.getFloat32(0, true),
	tacho: (data) => data.getFloat32(0, true),
	rpm: (data) => data.getFloat32(0, true),
	volts: (data) => data.getFloat32(0, true),
	wattHours: (data) => data.getFloat32(0, true),
	error: (data) => data.getUint8(0),
};

export type BluetoothStatus = 'disconnected' | 'connecting' | 'connected';
export type CharacteristicKeys = keyof CarState;

interface BluetoothEventMap {
	// Whenever the status of the bluetooth connection is changed
	status: (status: BluetoothStatus) => void;
	// WARNING: emits for all updates, for each single characteristic
	characteristicUpdate: (characteristic: CharacteristicKeys, value: number) => void;
}

/**
 * The data that the BluetoothContext provides
 * @see BluetoothContext
 */
export interface BluetoothContextType {
	/**
	 * Events about the status of the connection and updating of data
	 */
	events: EventEmitter<BluetoothEventMap>;
	/**
	 * @returns The current status of the bluetooth connection
	 */
	getStatus: () => BluetoothStatus;
	/**
	 * Attempts to connect to the Bluetooth server
	 */
	connect: () => Promise<void>;
	/**
	 * Disconnects from the Bluetooth server
	 */
	disconnect: () => void;
}

/**
 * Access the data that the BluetoothContext provides
 * @example ```js
 * const { events, connect, disconnect } = useContext(BluetoothContext);
 * ```
 */
export const BluetoothContext = createContext<BluetoothContextType | undefined>(undefined);

/**
 * A wrapper for providing the BluetoothContext values to its children.
 * Manages the bluetooth connection and provides updates via the returned EventEmitter and functions
 */
export default function BluetoothContextProvider({ children }: { children: React.ReactNode }) {
	const status = useRef<BluetoothStatus>('disconnected');
	const events = useRef(new EventEmitter<BluetoothEventMap>());

	const savedDevice = useRef<BluetoothDevice | undefined>(undefined);
	const server = useRef<BluetoothRemoteGATTServer | undefined>(undefined);

	const characteristics = useRef<Record<CharacteristicKeys, BluetoothRemoteGATTCharacteristic> | undefined>(undefined);

	// Returns the status of the connection
	function getStatus() {
		return status.current;
	}

	// Prompts the user to select a bluetooth device and starts the connection process
	async function connect() {
		// Cache the actual logic, preventing it from being called multiple times
		await cachedAsyncFunction(async () => {
			disconnect();

			savedDevice.current = await navigator.bluetooth.requestDevice({
				filters: [{ services: [SERVICE_UUID] }],
				optionalServices: [SERVICE_UUID],
				// acceptAllDevices: true,
			});

			await connectToDevice();

			savedDevice.current.addEventListener('gattserverdisconnected', () => {
				console.log('GATT server disconnected');
				// Don't set device to null here, as we want to keep the device object around for reconnecting
				server.current = undefined;
				characteristics.current = undefined;
				events.current.emit('status', 'disconnected');
			});
		})();
	}

	// Attempts to connect to the GATT server of the saved device and get the primary service and characteristics
	async function connectToDevice() {
		if (!savedDevice.current) throw new Error('No device selected');

		server.current = undefined;
		characteristics.current = undefined;

		try {
			events.current.emit('status', 'connecting');
			server.current = await savedDevice.current.gatt?.connect();
			if (server !== null) {
				console.log('Connected to gatt server');
			} else {
				throw new Error('Failed to connect to gatt server');
			}

			try {
				await getCharacteristics();
				console.log('Connected to radio');
				events.current.emit('status', 'connected');
			} catch (e) {
				savedDevice.current = undefined; // Clear device so we can't reconnect to it, as it doesn't have the correct characteristics
				throw e; // Continue the error stack
			}
		} catch (e) {
			// Clear all the variables before throwing the error
			server.current = undefined;
			characteristics.current = undefined;
			events.current.emit('status', 'disconnected');
			throw e;
		}
	}

	// Populates the characteristics variables with the correct characteristics
	async function getCharacteristics() {
		if (!server.current) throw new Error('Not connected');

		const service = await server.current.getPrimaryService(SERVICE_UUID);
		if (!service) throw new Error('Failed to get service');

		// Crazy one-liner, but this retrieves all the defined characteristics from the server all at the same time
		characteristics.current = Object.fromEntries(
			await Promise.all(
				Object.entries(CHARACTERISTIC_UUIDS).map(([name, uuid]) =>
					(async () => [name, await service.getCharacteristic(uuid)])()
				)
			)
		) as Record<CharacteristicKeys, BluetoothRemoteGATTCharacteristic>;

		// Subscribe to all characteristic updates
		await Promise.all(Object.values(characteristics.current).map((c) => c.startNotifications()));
		// Attach event listeners that proxy to the 'characteristicUpdate' event
		Object.entries(characteristics.current).forEach(([name, c]) =>
			c.addEventListener('characteristicvaluechanged', () => {
				if (c.value) {
					events.current.emit(
						'characteristicUpdate',
						name as CharacteristicKeys,
						CHARACTERISTIC_DECODE_FUNCTIONS[name as CharacteristicKeys](c.value)
					);
				}
			})
		);
	}

	// Disconnects from the GATT server and forgets the device
	function disconnect() {
		if (server.current) {
			savedDevice.current = undefined;
			server.current.disconnect(); // Will trigger the gattserverdisconnected event, which will clear the other variables
		}
	}

	// Automatically disconnects from the server is this component is ever unmounted
	useEffect(() => disconnect);

	const value = {
		events: events.current,
		getStatus,
		connect,
		disconnect,
	};

	return <BluetoothContext value={value}>{children}</BluetoothContext>;
}

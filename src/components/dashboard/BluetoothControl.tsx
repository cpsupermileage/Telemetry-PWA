import { use, useEffect, useState } from 'react';
import { BluetoothContext, type BluetoothStatus } from '../context/BluetoothContextProvider';
import Widget from './Widget';
import { BluetoothConnected, BluetoothOff, BluetoothSearching } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';

function BluetoothControl() {
	const ble = use(BluetoothContext);

	const [status, setStatus] = useState<BluetoothStatus>(ble?.getStatus() ?? 'disconnected');
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (!ble) return;
		ble.events.on('status', setStatus);
		return () => {
			ble.events.off('status', setStatus);
		};
	}, [ble]);

	function onClick() {
		if (!('bluetooth' in navigator)) return alert('Web Bluetooth not supported, try using a different browser');
		if (status === 'disconnected') void ble?.connect();
		else setOpen(true);
	}

	return (
		<>
			<button type="button" onClick={onClick} className="cursor-pointer">
				<Widget className="p-2">
					{status === 'disconnected' && <BluetoothOff className="text-red-400" />}
					{status === 'connecting' && <BluetoothSearching className="text-yellow-300" />}
					{status === 'connected' && <BluetoothConnected className="text-green-400" />}
				</Widget>
			</button>
			<DropdownMenu open={open} onOpenChange={setOpen}>
				<DropdownMenuContent>
					{status !== 'disconnected' && <DropdownMenuItem onClick={ble?.disconnect}>Disconnect</DropdownMenuItem>}
				</DropdownMenuContent>
			</DropdownMenu>
		</>
	);
}

export default BluetoothControl;

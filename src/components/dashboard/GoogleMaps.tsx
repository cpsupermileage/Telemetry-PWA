import { type MapCameraProps } from '@vis.gl/react-google-maps';
import { use, useEffect, useState } from 'react';
import { Alert, AlertTitle } from '../ui/alert';
import { AlertCircleIcon, MapPinned } from 'lucide-react';
import { Button } from '../ui/button';
import { DriverContext } from '../context/DriverContextProvider';
import ControlledGoogleMaps from './ControlledGoogleMaps';

function GoogleMaps() {
	const driver = use(DriverContext);

	const [permissionState, setPermissionState] = useState<PermissionState>('denied');

	useEffect(() => {
		void navigator.permissions.query({ name: 'geolocation' }).then((status) => {
			setPermissionState(status.state);
		});
	}, []);

	function promptForLocation() {
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				setPermissionState('granted');
				setCameraProps((prev) => ({
					...prev,
					center: {
						lat: pos.coords.latitude,
						lng: pos.coords.longitude,
					},
					heading: pos.coords.heading ?? undefined,
				}));
			},
			(err) => {
				if (err.code === GeolocationPositionError.PERMISSION_DENIED) setPermissionState('denied');
				else {
					console.error('Could not prompt for location permission: ', err.message);
					alert(err.message);
				}
			}
		);
	}

	const [cameraProps, setCameraProps] = useState<Partial<MapCameraProps>>({});

	useEffect(() => {
		if (permissionState !== 'granted') return;

		const watchId = navigator.geolocation.watchPosition(
			(pos) => {
				setCameraProps({
					center: {
						lat: pos.coords.latitude,
						lng: pos.coords.longitude,
					},
					heading: pos.coords.heading ?? undefined,
				});
				driver?.setGeolocation?.(pos);
			},
			(err) => {
				if (err.code === GeolocationPositionError.PERMISSION_DENIED) setPermissionState('denied');
				else {
					console.error('Could not get location: ', err.message);
				}
			},
			{
				enableHighAccuracy: true,
				maximumAge: 0,
			}
		);
		console.log('Subscribed to geolocation', watchId);

		return () => navigator.geolocation.clearWatch(watchId);
	}, [permissionState, driver]);

	return permissionState === 'granted' ? (
		<ControlledGoogleMaps {...cameraProps} />
	) : permissionState === 'prompt' ? (
		<Button onClick={promptForLocation} className="m-8 w-fit">
			<MapPinned />
			Enable Map
		</Button>
	) : (
		<Alert variant="destructive" className="m-8 w-fit">
			<AlertCircleIcon />
			<AlertTitle>
				Please enable the <code>location</code> permission
			</AlertTitle>
		</Alert>
	);
}

export default GoogleMaps;

import { APIProvider, Map, type MapCameraChangedEvent, type MapCameraProps } from '@vis.gl/react-google-maps';
import { use, useEffect, useState } from 'react';
import { Alert, AlertTitle } from '../ui/alert';
import { AlertCircleIcon, MapPinned } from 'lucide-react';
import { Button } from '../ui/button';
import { CommonTelemetryContext } from '../context/CommonTelemetryContextProvider';

const GOOGLE_MAPS_API_KEY = import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY as string | undefined;

const INITIAL_CAMERA = {
	center: { lat: 35.3031, lng: -120.661 },
	zoom: 18,
	tilt: 45,
};

function GoogleMaps() {
	const telemetry = use(CommonTelemetryContext);

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

	const [cameraProps, setCameraProps] = useState<MapCameraProps>(INITIAL_CAMERA);

	function handleCameraChange(ev: MapCameraChangedEvent) {
		setCameraProps(ev.detail);
	}

	useEffect(() => {
		if (permissionState !== 'granted') return;

		const watchId = navigator.geolocation.watchPosition(
			(pos) => {
				setCameraProps((prev) => ({
					...prev,
					center: {
						lat: pos.coords.latitude,
						lng: pos.coords.longitude,
					},
					heading: pos.coords.heading ?? undefined,
				}));
				telemetry.setGeolocation?.(pos);
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

		return navigator.geolocation.clearWatch(watchId);
	}, [permissionState, telemetry]);

	return GOOGLE_MAPS_API_KEY && permissionState === 'granted' ? (
		<APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
			<Map
				style={{ width: '100%', height: '100%' }}
				zoomControl
				{...cameraProps}
				onCameraChanged={handleCameraChange}
				minZoom={16}
				gestureHandling=""
				disableDefaultUI
				mapTypeId="satellite"
			/>
		</APIProvider>
	) : !GOOGLE_MAPS_API_KEY ? (
		<Alert variant="destructive" className="m-8">
			<AlertCircleIcon />
			<AlertTitle>
				Please define <code>GOOGLE_MAPS_API_KEY</code>
			</AlertTitle>
		</Alert>
	) : permissionState === 'prompt' ? (
		<Button onClick={promptForLocation} className="m-8">
			<MapPinned />
			Enable Map
		</Button>
	) : (
		<Alert variant="destructive" className="m-8">
			<AlertCircleIcon />
			<AlertTitle>
				Please enable the <code>location</code> permission
			</AlertTitle>
		</Alert>
	);
}

export default GoogleMaps;

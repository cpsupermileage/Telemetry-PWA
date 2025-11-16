import { APIProvider, Map, type MapProps } from '@vis.gl/react-google-maps';
import { AlertCircleIcon } from 'lucide-react';
import { Alert, AlertTitle } from '../ui/alert';

const GOOGLE_MAPS_API_KEY = import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY as string | undefined;

function ControlledGoogleMaps(props: MapProps) {
	return GOOGLE_MAPS_API_KEY ? (
		props.center ? (
			<APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
				<Map
					style={{ width: '100%', height: '100%' }}
					zoomControl
					cameraControl={false}
					minZoom={16}
					defaultZoom={18}
					defaultTilt={45}
					gestureHandling=""
					disableDefaultUI
					mapTypeId="satellite"
					{...props}
				/>
			</APIProvider>
		) : (
			<Alert variant="destructive" className="m-8 w-fit">
				<AlertCircleIcon />
				<AlertTitle>No Location Data</AlertTitle>
			</Alert>
		)
	) : (
		<Alert variant="destructive" className="m-8 w-fit">
			<AlertCircleIcon />
			<AlertTitle>
				Please define <code>GOOGLE_MAPS_API_KEY</code>
			</AlertTitle>
		</Alert>
	);
}

export default ControlledGoogleMaps;

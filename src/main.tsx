import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { BrowserRouter, Route, Routes } from 'react-router';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import DriverContextProvider from './components/context/DriverContextProvider';
import { Toaster } from './components/ui/sonner';
import SpectatorContextProvider from './components/context/SpectatorContextProvider';
import TelemetryContextProvider from './components/context/TelemetryContextProvider';
import BluetoothContextProvider from './components/context/BluetoothContextProvider';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<TelemetryContextProvider>
			<BluetoothContextProvider>
				<BrowserRouter>
					<Routes>
						<Route index element={<Home />} />
						<Route
							path="driver"
							element={
								<DriverContextProvider>
									<Dashboard />
								</DriverContextProvider>
							}
						/>
						<Route
							path="spectator/:tripId"
							element={
								<SpectatorContextProvider>
									<Dashboard />
								</SpectatorContextProvider>
							}
						/>
					</Routes>
				</BrowserRouter>
				<Toaster />
			</BluetoothContextProvider>
		</TelemetryContextProvider>
	</StrictMode>
);

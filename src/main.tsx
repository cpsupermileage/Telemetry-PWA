import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { BrowserRouter, Outlet, Route, Routes } from 'react-router';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import DriverContextProvider from './components/context/DriverContextProvider';
import { Toaster } from './components/ui/sonner';
import SpectatorContextProvider from './components/context/SpectatorContextProvider';
import TelemetryContextProvider from './components/context/TelemetryContextProvider';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<TelemetryContextProvider>
			<BrowserRouter>
				<Routes>
					<Route index element={<Home />} />
					<Route
						path="driver"
						element={
							<DriverContextProvider>
								<Outlet />
							</DriverContextProvider>
						}
					>
						<Route path="dashboard" element={<Dashboard />} />
					</Route>
					<Route
						path="spectator"
						element={
							<SpectatorContextProvider>
								<Outlet />
							</SpectatorContextProvider>
						}
					>
						<Route path="dashboard" element={<Dashboard />} />
					</Route>
				</Routes>
			</BrowserRouter>
			<Toaster />
		</TelemetryContextProvider>
	</StrictMode>
);

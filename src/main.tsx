import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { BrowserRouter, Outlet, Route, Routes } from 'react-router';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import DriverTelemetryContextProvider from './components/context/DriverTelemetryContextProvider';
import { Toaster } from './components/ui/sonner';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<BrowserRouter>
			<Routes>
				<Route index element={<Home />} />
				<Route
					path="driver"
					element={
						<DriverTelemetryContextProvider>
							<Outlet />
						</DriverTelemetryContextProvider>
					}
				>
					<Route path="dashboard" element={<Dashboard />} />
				</Route>
				<Route path="spectator">
					<Route path="dashboard" element={<Dashboard />} />
				</Route>
			</Routes>
		</BrowserRouter>
		<Toaster />
	</StrictMode>
);

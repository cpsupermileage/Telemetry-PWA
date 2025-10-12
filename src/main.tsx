import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { BrowserRouter, Route, Routes } from 'react-router';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<BrowserRouter>
			<Routes>
				<Route index element={<Home />} />
				<Route path="driver">
					<Route path="dashboard" element={<Dashboard />} />
				</Route>
				<Route path="spectator">
					<Route path="dashboard" element={<Dashboard />} />
				</Route>
			</Routes>
		</BrowserRouter>
	</StrictMode>
);

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { VitePWA, type ManifestOptions } from 'vite-plugin-pwa';

const manifest: Partial<ManifestOptions> = {
	name: 'SMV Telemetry',
	short_name: 'SMVT',
	start_url: '/',
	display: 'standalone',
	description: "Driver dashboard & Telemetry System for CalPoly's SMV Team",
	theme_color: '#050706',
	background_color: '#050706',
	// From `pnpm run generate-pwa-assets`
	icons: [
		{
			src: 'pwa-64x64.png',
			sizes: '64x64',
			type: 'image/png',
		},
		{
			src: 'pwa-192x192.png',
			sizes: '192x192',
			type: 'image/png',
		},
		{
			src: 'pwa-512x512.png',
			sizes: '512x512',
			type: 'image/png',
		},
		{
			src: 'maskable-icon-512x512.png',
			sizes: '512x512',
			type: 'image/png',
			purpose: 'maskable',
		},
	],
};

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react({
			babel: {
				plugins: ['babel-plugin-react-compiler'],
			},
		}),
		tailwindcss(),
		VitePWA({
			registerType: 'autoUpdate',
			manifest,
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
			},
		}),
	],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
	define: {
		APP_VERSION: JSON.stringify(process.env.npm_package_version),
		BUILD_DATE: Date.now(),
	},
	envPrefix: 'PUBLIC_',
});

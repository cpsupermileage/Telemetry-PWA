import { defineConfig, type Preset } from '@vite-pwa/assets-generator/config';

export const preset: Preset = {
	transparent: {
		sizes: [64, 192, 512],
		favicons: [[48, 'favicon.ico']],
	},
	maskable: {
		sizes: [512],
		resizeOptions: {
			background: '#050706',
			fit: 'contain',
		},
	},
	apple: {
		sizes: [180],
		resizeOptions: {
			background: '#050706',
			fit: 'contain',
		},
	},
};

export default defineConfig({
	headLinkOptions: {
		preset: '2023',
	},
	preset,
	images: ['public/logo.svg'],
});

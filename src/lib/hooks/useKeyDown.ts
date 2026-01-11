import { useEffect } from 'react';

export default function useKeyDown(keys: string[], callback: () => void) {
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (keys.some((key) => event.key == key)) {
				event.preventDefault();
				callback();
			}
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [callback, keys]);
}

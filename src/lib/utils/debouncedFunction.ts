export default function debouncedFunction<T>(fn: () => T, debounceMs: number): () => void {
	let timeout: number | undefined = undefined;
	let lastRun = 0; // epoch

	function run() {
		lastRun = Date.now();
		fn();
	}

	return () => {
		if (timeout) clearTimeout(timeout);
		if (Date.now() - lastRun > debounceMs) run();
		else timeout = setTimeout(run, debounceMs);
	};
}

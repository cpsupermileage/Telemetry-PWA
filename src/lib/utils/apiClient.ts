/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/no-explicit-any */

const API_BASE = import.meta.env.PUBLIC_API_BASE as string | undefined;

export default async function apiRequest(
	method: string,
	url: string,
	data?: any | FormData,
	init?: RequestInit
): Promise<any> {
	const res = await fetch(new URL(url, API_BASE), {
		method,
		headers: data && !(data instanceof FormData) ? { 'Content-Type': 'application/json' } : {},
		body: data ? (data instanceof FormData ? data : JSON.stringify(data)) : undefined,
		...init,
	});

	if (res.ok) return await res.json();
	else {
		let message = res.statusText || 'An error occurred';
		try {
			message = ((await res.json()) as { message: string }).message;
		} catch {
			/* empty */
		}
		throw new Error(message);
	}
}

/**
 * Securely generates a random signed int32 that is guaranteed to be positive
 */
export default function genRandomId(): number {
	return Math.abs(crypto.getRandomValues(new Int32Array(1))[0]);
}

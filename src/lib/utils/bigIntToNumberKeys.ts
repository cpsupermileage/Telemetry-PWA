// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
export const bigIntToNumber = (v: any) => (typeof v === 'bigint' ? Number(v) : v);

export const bigIntToNumberKeys = (row: object) =>
	Object.fromEntries(Object.entries(row).map(([k, v]) => [k, bigIntToNumber(v)]));

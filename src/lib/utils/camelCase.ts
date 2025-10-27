export const toCamelCase = (str: string) => str.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());

export const camelCaseKeys = (row: object) =>
	Object.fromEntries(Object.entries(row).map(([k, v]) => [toCamelCase(k), v]));

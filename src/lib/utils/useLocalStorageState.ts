import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

/**
 * Extension of React.useState to save the value in local storage, useful for persisting state through reloads
 * @param key - The key in local storage where the value will be stored
 * @param initialState - The initial value, if not already defined in local storage
 * @returns A stateful value, and a function to update it
 */
export default function useLocalStorageState<S>(
	key: string,
	initialState: S | (() => S)
): [S, Dispatch<SetStateAction<S>>] {
	const item = localStorage.getItem(key);

	const [value, setValue] = useState<S>(item !== null ? (JSON.parse(item) as S) : initialState);

	useEffect(() => {
		localStorage.setItem(key, JSON.stringify(value));
	}, [key, value]);

	return [value, setValue];
}

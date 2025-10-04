import { browser } from '$app/environment';
import { writable } from 'svelte/store';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'pebbles-theme';

const getStoredTheme = (): Theme | null => {
	if (!browser) return null;
	const stored = localStorage.getItem(STORAGE_KEY);
	return stored === 'light' || stored === 'dark' ? stored : null;
};

const applyTheme = (value: Theme) => {
	if (!browser) return;
	const root = document.documentElement;
	root.dataset.theme = value;
	root.classList.toggle('dark', value === 'dark');
};

let manualPreference: Theme | null = null;
let prefersDark: MediaQueryList | null = null;

if (browser) {
	manualPreference = getStoredTheme();
	prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
}

const getSystemTheme = (): Theme => (prefersDark?.matches ? 'dark' : 'light');

const initialTheme: Theme = browser ? (manualPreference ?? getSystemTheme()) : 'light';

const theme = writable<Theme>(initialTheme);

const persistManualPreference = (value: Theme | null) => {
	manualPreference = value;
	if (!browser) return;
	if (value) {
		localStorage.setItem(STORAGE_KEY, value);
	} else {
		localStorage.removeItem(STORAGE_KEY);
	}
};

if (browser) {
	theme.subscribe(applyTheme);

	if (prefersDark) {
		const handlePreferenceChange = (event: MediaQueryListEvent) => {
			if (manualPreference === null) {
				theme.set(event.matches ? 'dark' : 'light');
			}
		};

		if (typeof prefersDark.addEventListener === 'function') {
			prefersDark.addEventListener('change', handlePreferenceChange);
		} else if (typeof prefersDark.addListener === 'function') {
			prefersDark.addListener(handlePreferenceChange);
		}
	}

	window.addEventListener('storage', (event) => {
		if (event.key !== STORAGE_KEY) return;
		if (event.newValue === 'light' || event.newValue === 'dark') {
			manualPreference = event.newValue;
			theme.set(manualPreference);
		} else if (event.newValue === null) {
			manualPreference = null;
			theme.set(getSystemTheme());
		}
	});
}

const setTheme = (value: Theme) => {
	persistManualPreference(value);
	theme.set(value);
};

const toggleTheme = () => {
	theme.update((current) => {
		const next = current === 'dark' ? 'light' : 'dark';
		persistManualPreference(next);
		return next;
	});
};

const useSystemTheme = () => {
	if (!browser) return;
	persistManualPreference(null);
	theme.set(getSystemTheme());
};

export { theme, setTheme, toggleTheme, useSystemTheme };
export type { Theme };

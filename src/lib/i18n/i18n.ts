import { derived, writable, type Readable } from 'svelte/store';
import { load as yamlLoad } from 'js-yaml';

type Dict = Record<string, unknown>;

// Import all locale YAML files as raw strings and parse them
// Vite: use query + import per deprecation notice
const rawFiles = import.meta.glob('./locales/*.yml', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

const catalogs: Record<string, Dict> = {};
for (const path in rawFiles) {
	const raw = rawFiles[path];
	const locale = path.split('/').pop()!.split('.')[0];
	try {
		catalogs[locale] = (yamlLoad(raw) as Dict) ?? {};
	} catch {
		catalogs[locale] = {};
	}
}

const availableLocales = Object.keys(catalogs);
const resolvedDefaultLocale =
	(availableLocales.includes('fr') ? 'fr' : availableLocales[0]) ?? 'en';

export const defaultLocale = resolvedDefaultLocale;

export type Locale = keyof typeof catalogs extends string ? keyof typeof catalogs : string;

export const locale = writable<Locale>(resolvedDefaultLocale as Locale);

function resolveCatalog(targetLocale?: string) {
	if (targetLocale) {
		const normalized = targetLocale.toLowerCase();
		if (normalized in catalogs) {
			return catalogs[normalized];
		}
		const languageOnly = normalized.split('-')[0];
		if (languageOnly && languageOnly in catalogs) {
			return catalogs[languageOnly];
		}
	}

	return catalogs[resolvedDefaultLocale] ?? {};
}

export const dictionary: Readable<Dict> = derived(locale, ($l) => resolveCatalog($l));

function get(obj: unknown, path: string) {
	return path.split('.').reduce<unknown>((current, key) => {
		if (current && typeof current === 'object') {
			return (current as Record<string, unknown>)[key];
		}

		return undefined;
	}, obj);
}

function format(str: string, params?: Record<string, unknown>) {
	if (!params) return str;
	return str.replace(/\{(.*?)\}/g, (_, k) => {
		const v = params[k];
		return v == null ? '' : String(v);
	});
}

export const t: Readable<(key: string, params?: Record<string, unknown>) => string> = derived(
	dictionary,
	($d) => (key: string, params?: Record<string, unknown>) => {
		const val = get($d, key);
		if (typeof val === 'string') return format(val, params);
		return key;
	}
);

export function translateInstant(
	key: string,
	params?: Record<string, unknown>,
	targetLocale?: string
) {
	const dict = resolveCatalog(targetLocale);
	const val = get(dict, key);
	if (typeof val === 'string') return format(val, params);
	return key;
}

export function setLocale(l: Locale) {
	if (catalogs[l]) locale.set(l);
}

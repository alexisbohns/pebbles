import { writable } from 'svelte/store';

export type Entry = {
	id: string;
	date: string;
	situation: string;
	thought: string;
	emotion: string;
	behavior: string;
	alternative: string;
};

function createEntriesStore() {
	const { subscribe, set, update } = writable<Entry[]>([]);

	if (typeof window !== 'undefined') {
		const saved = localStorage.getItem('entries');
		if (saved) {
			set(JSON.parse(saved));
		}
	}

	const persist = (entries: Entry[]) => {
		if (typeof window !== 'undefined') {
			localStorage.setItem('entries', JSON.stringify(entries));
		}
	};

	return {
		subscribe,
		add: (entry: Omit<Entry, 'id' | 'date'>) =>
			update((entries) => {
				const newEntry: Entry = {
					id: crypto.randomUUID(),
					date: new Date().toISOString(),
					...entry
				};
				const newEntries = [...entries, newEntry];
				persist(newEntries);
				return newEntries;
			}),
		remove: (id: string) =>
			update((entries) => {
				const newEntries = entries.filter((e) => e.id !== id);
				persist(newEntries);
				return newEntries;
			}),
		clear: () => {
			persist([]);
			set([]);
		}
	};
}

export const entriesStore = createEntriesStore();

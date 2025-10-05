// See https://svelte.dev/docs/kit/types#app.d.ts

import type { SupabaseClient, User } from '@supabase/supabase-js';

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient;
			user: User | null;
		}
		// interface Error {}
		// interface Locals {}
		interface PageData {
			user: User | null;
			profile?: {
				full_name: string | null;
				avatar_url: string | null;
				role: string | null;
				created_at: string | null;
			} | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};

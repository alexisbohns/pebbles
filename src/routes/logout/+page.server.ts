import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { error } = await locals.supabase.auth.signOut();

	if (error) {
		throw redirect(303, `/login?error=${encodeURIComponent(error.message)}`);
	}

	throw redirect(303, '/login');
};

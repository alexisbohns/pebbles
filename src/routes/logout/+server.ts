import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const handleLogout: RequestHandler = async ({ locals }) => {
	const { error } = await locals.supabase.auth.signOut();

	if (error) {
		throw redirect(303, `/login?error=${encodeURIComponent(error.message)}`);
	}

	throw redirect(303, '/login');
};

export const POST: RequestHandler = async (event) => handleLogout(event);
export const GET: RequestHandler = async (event) => handleLogout(event);

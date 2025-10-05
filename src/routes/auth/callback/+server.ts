import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	const errorDescription = url.searchParams.get('error_description');

	if (errorDescription) {
		throw redirect(303, `/login?error=${encodeURIComponent(errorDescription)}`);
	}

	if (!code) {
		throw redirect(303, '/login?error=Missing%20OAuth%20code');
	}

	const { error } = await locals.supabase.auth.exchangeCodeForSession(code);

	if (error) {
		throw redirect(303, `/login?error=${encodeURIComponent(error.message)}`);
	}

	throw redirect(303, '/home');
};

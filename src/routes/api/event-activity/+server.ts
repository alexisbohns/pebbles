import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '$env/static/private';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function GET({ locals }) {
	const user = locals.user;
	if (!user) return new Response('Unauthorized', { status: 401 });

	const { data, error } = await supabase
		.from('event_activity_projection')
		.select('created_activity, occurrence_activity')
		.eq('profile_id', user.id)
		.single();

	if (error) return new Response(error.message, { status: 500 });
	return json(data);
}

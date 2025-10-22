import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { buildTemplateContext } from './template-context.server';

export const load: LayoutServerLoad = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		throw redirect(303, '/login');
	}

	if (!supabase) {
		throw error(500, 'Supabase client unavailable');
	}

	const context = await buildTemplateContext({
		supabase,
		templateName: params.template
	});

	return {
		profileId: user.id,
		config: context.config,
		templateItems: context.templateItems,
		emotions: context.emotions,
		associations: context.associations,
		questions: context.questions
	};
};

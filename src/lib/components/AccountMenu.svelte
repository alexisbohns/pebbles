<script lang="ts">
	import { t } from '$lib';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

	type ThemePreference = 'light' | 'dark' | 'system';

	const noop = () => {};

	export let displayName = '';
	export let email = '';
	export let avatarUrl = '';
	export let themePreference: ThemePreference = 'system';
	export let onThemeSelect: (value: string) => void = noop;
	export let onAvatarError: (event: Event) => void = noop;
	export let onProfile: () => void = noop;
	export let onLogout: () => void = noop;
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger
		class="inline-flex items-center justify-center"
		aria-label={displayName || $t('pages.profile.title')}
	>
		<img
			src={avatarUrl}
			alt={displayName ? `${displayName}'s avatar` : 'Profile avatar'}
			width="32"
			height="32"
			onerror={onAvatarError}
			class="avatar"
		/>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end" class="grid min-w-[14rem] gap-1 p-2">
		<DropdownMenu.Item onSelect={onProfile}>
			<div class="flex flex-col">
				<span class="font-semibold">{displayName}</span>
				{#if email}
					<span class="text-xs text-muted-foreground">{email}</span>
				{/if}
			</div>
		</DropdownMenu.Item>
		<DropdownMenu.Separator />
		<DropdownMenu.Label class="px-2 text-xs font-medium text-muted-foreground">
			{$t('common.mode')}
		</DropdownMenu.Label>
		<DropdownMenu.RadioGroup
			class="grid gap-1"
			value={themePreference}
			onValueChange={onThemeSelect}
		>
			<DropdownMenu.RadioItem value="light">{$t('common.light')}</DropdownMenu.RadioItem>
			<DropdownMenu.RadioItem value="dark">{$t('common.dark')}</DropdownMenu.RadioItem>
			<DropdownMenu.RadioItem value="system">{$t('common.system')}</DropdownMenu.RadioItem>
		</DropdownMenu.RadioGroup>
		<DropdownMenu.Separator />
		<DropdownMenu.Item onSelect={onLogout}>
			{$t('common.logout')}
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>

<style lang="postcss">
	.avatar {
		border-radius: 9999px;
		width: 2rem;
		height: 2rem;
		object-fit: cover;
	}
</style>

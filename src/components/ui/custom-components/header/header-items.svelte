<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// CONSTANTS
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// HOOKS
	import { usePathname } from '@/hooks/usePathname.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';

	const pathname = usePathname();

	const activeNavClass =
		'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground';
</script>

<nav
	aria-label={m['Components.Header.navigation']()}
	class="hidden items-center justify-center gap-1 lg:flex"
>
	<Button
		variant="ghost"
		href={UNPROTECTED_PAGE_ENDPOINTS.CONTACT}
		aria-current={pathname.isActive(UNPROTECTED_PAGE_ENDPOINTS.CONTACT) ? 'page' : undefined}
		class={cn(
			'text-header-foreground hover:bg-header-foreground/10 hover:text-header-foreground',
			pathname.isActive(UNPROTECTED_PAGE_ENDPOINTS.CONTACT) && activeNavClass
		)}
	>
		{m['Components.Header.contact']()}
	</Button>

	<Button
		variant="ghost"
		href={UNPROTECTED_PAGE_ENDPOINTS.FEEDBACK}
		aria-current={pathname.isActive(UNPROTECTED_PAGE_ENDPOINTS.FEEDBACK) ? 'page' : undefined}
		class={cn(
			'text-header-foreground hover:bg-header-foreground/10 hover:text-header-foreground',
			pathname.isActive(UNPROTECTED_PAGE_ENDPOINTS.FEEDBACK) && activeNavClass
		)}
	>
		{m['Components.Header.feedback']()}
	</Button>
</nav>

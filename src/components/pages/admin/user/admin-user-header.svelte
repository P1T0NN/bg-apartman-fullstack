<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button';
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';
</script>

<div class="flex items-center">
	<Button href={ADMIN_PAGE_ENDPOINTS.USERS} variant="ghost" size="sm">
		<span class="icon-[lucide--arrow-left] size-4" aria-hidden="true"></span>
		{m['AdminUserPage.AdminUserHeader.backToUsers']()}
	</Button>
</div>

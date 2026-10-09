<script lang="ts">
	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';
	import { Skeleton } from '@/components/ui/skeleton/index.js';
</script>

<Card.Root aria-hidden="true">
	<Card.Content class="flex flex-col gap-4">
		<Skeleton class="h-8 w-48" />
		<Skeleton class="h-16 w-full" />
		<Skeleton class="h-11 w-32" />
	</Card.Content>
</Card.Root>

<script lang="ts">
	import { Skeleton } from '@/components/ui/skeleton/index.js';
</script>

<div class="flex flex-col gap-6 rounded-xl border p-6" aria-hidden="true">
	<Skeleton class="h-6 w-40" />
	<div class="grid gap-8 lg:grid-cols-2">
		<div class="flex flex-col gap-3">
			<Skeleton class="h-20 w-full max-w-sm" />
			<Skeleton class="h-12 w-full max-w-sm" />
		</div>
		<div class="flex flex-col gap-3">
			<Skeleton class="h-20 w-20" />
			<Skeleton class="h-5 w-48" />
		</div>
	</div>
	<Skeleton class="h-11 w-32" />
</div>

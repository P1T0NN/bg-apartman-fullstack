<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';

	let { label, icon }: { label: string; icon: string } = $props();
</script>

<li class="flex items-center gap-4 py-3.5 text-base">
	<span class={cn(icon, 'size-6 shrink-0')} aria-hidden="true"></span>
	{label}
</li>

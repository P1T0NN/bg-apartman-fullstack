<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';

	let { label, icon }: { label: string; icon: string } = $props();
</script>

<li class="flex items-center gap-3 py-2.5 text-sm">
	<span class={cn(icon, 'size-5 shrink-0 text-muted-foreground')} aria-hidden="true"></span>
	{label}
</li>

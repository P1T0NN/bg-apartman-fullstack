<script lang="ts">
	import { m } from '@/lib/paraglide/messages';
	let {
		mode = 'request',
		compact = false
	}: {
		mode?: 'request' | 'instant';
		compact?: boolean;
	} = $props();
</script>

<div class="flex flex-col gap-1.5">
	<p class="flex items-center gap-2 text-sm font-medium">
		<span
			class={mode === 'instant' ? 'icon-[lucide--zap] size-4' : 'icon-[lucide--clock] size-4'}
			aria-hidden="true"
		></span>
		{mode === 'instant'
			? m['AccommodationsFeature.BookingMode.instant']()
			: m['AccommodationsFeature.BookingMode.request']()}
	</p>
	{#if !compact}
		<p class="text-sm leading-6 text-muted-foreground">
			{mode === 'instant'
				? m['AccommodationsFeature.BookingMode.instantHint']()
				: m['AccommodationsFeature.BookingMode.requestHint']()}
		</p>
	{/if}
</div>

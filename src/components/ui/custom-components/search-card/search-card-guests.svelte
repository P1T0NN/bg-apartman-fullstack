<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import Counter from '@/components/ui/custom-components/counter/counter.svelte';
	import Plural from '@/components/ui/custom-components/plural/plural.svelte';
	import * as Field from '@/components/ui/field/index.js';
	import NativePopover from '@/components/ui/native-components/native-popover/native-popover.svelte';

	// UTILS
	import { m } from '@/lib/paraglide/messages';
	import { cn } from '@/utils/utils.js';

	type GuestCounts = { adults: number; children: number; rooms: number };

	const uid = $props.id();
	const popoverId = `home-guests-${uid}`;

	let {
		value = $bindable<GuestCounts>({ adults: 2, children: 0, rooms: 1 }),
		dark = false
	}: { value?: GuestCounts; dark?: boolean } = $props();

	function closeGuests(): void {
		const popover = document.getElementById(popoverId);
		if (popover?.matches(':popover-open')) popover.hidePopover();
	}
</script>

{#snippet guestsTrigger()}
	<span
		class={cn(
			'icon-[lucide--users] size-4 shrink-0',
			dark ? 'text-header-foreground/60' : 'text-muted-foreground'
		)}
	></span>
	<span class="flex items-center gap-1.5 truncate">
		<Plural
			count={value.adults}
			forms={{
				one: m['Components.SearchCardGuests.adult'](),
				other: m['Components.SearchCardGuests.adults']()
			}}
		/>
		{#if value.children > 0}
			<span aria-hidden="true">-</span>
			<Plural
				count={value.children}
				forms={{
					one: m['Components.SearchCardGuests.child'](),
					other: m['Components.SearchCardGuests.children']()
				}}
			/>
		{/if}
		{#if value.rooms > 0}
			<span aria-hidden="true">-</span>
			<Plural
				count={value.rooms}
				forms={{
					one: m['Components.SearchCardGuests.room'](),
					other: m['Components.SearchCardGuests.rooms']()
				}}
			/>
		{/if}
	</span>
{/snippet}

<Field.Field>
	<Field.Label>{m['Components.SearchCardGuests.label']()}</Field.Label>
	<NativePopover
		id={popoverId}
		trigger={guestsTrigger}
		triggerLabel={m['Components.SearchCardGuests.label']()}
		triggerClass={cn(
			'h-9 w-full justify-start gap-2 rounded-3xl border border-transparent px-3 text-sm font-normal transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30',
			dark ? 'bg-header-foreground/10 text-header-foreground' : 'bg-input/50'
		)}
		class={cn('w-72! p-4', dark && 'dark')}
	>
		<div class="flex flex-col gap-4">
			<Counter
				label={m['Components.SearchCardGuests.adults']()}
				bind:value={value.adults}
				min={1}
				max={16}
			/>
			<Counter
				label={m['Components.SearchCardGuests.children']()}
				bind:value={value.children}
				max={10}
			/>
			<Counter
				label={m['Components.SearchCardGuests.rooms']()}
				bind:value={value.rooms}
				min={1}
				max={8}
			/>

			<Button variant="outline" size="sm" class="w-full" onclick={closeGuests}>
				{m['Components.SearchCardGuests.close']()}
			</Button>
		</div>
	</NativePopover>
</Field.Field>

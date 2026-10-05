<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';
	import DangerZoneDeleteButton from './danger-zone-delete-button.svelte';
	import DangerZoneStatusButton from './danger-zone-status-button.svelte';
</script>

<section class="flex flex-col gap-5" aria-labelledby="danger-zone-title">
	<div>
		<h2 id="danger-zone-title" class="text-lg font-semibold text-destructive">
			{m['MyAccommodationPage.MyAccommodationTabSettingsDangerZone.title']()}
		</h2>
		<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
			{m['MyAccommodationPage.MyAccommodationTabSettingsDangerZone.description']()}
		</p>
	</div>

	<Card.Root class="w-full gap-0 divide-y divide-destructive/15 border border-destructive/25 py-0">
		<div class="flex flex-wrap items-center justify-between gap-4 p-5">
			<div class="max-w-sm">
				<h3 class="font-medium">
					{m['MyAccommodationPage.MyAccommodationTabSettingsDangerZone.visibilityTitle']()}
				</h3>
				<p class="mt-1 text-sm leading-relaxed text-muted-foreground">
					{m['MyAccommodationPage.MyAccommodationTabSettingsDangerZone.visibilityHint']()}
				</p>
			</div>

			<DangerZoneStatusButton />
		</div>

		<div class="flex flex-wrap items-center justify-between gap-4 p-5">
			<div class="max-w-sm">
				<h3 class="font-medium">
					{m['MyAccommodationPage.MyAccommodationTabSettingsDangerZone.deleteTitle']()}
				</h3>

				<p class="mt-1 text-sm leading-relaxed text-muted-foreground">
					{m['MyAccommodationPage.MyAccommodationTabSettingsDangerZone.deleteHint']()}
				</p>
			</div>

			<DangerZoneDeleteButton />
		</div>
	</Card.Root>
</section>

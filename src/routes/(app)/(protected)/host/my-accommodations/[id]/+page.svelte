<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import TabsUrl from '@/components/ui/custom-components/tabs-url/tabs-url.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import MyAccommodationHeader from '@/components/pages/(protected)/host/my-accommodation/my-accommodation-header.svelte';
	import MyAccommodationTabListing from '@/components/pages/(protected)/host/my-accommodation/my-accommodation-tab-listing/my-accommodation-tab-listing.svelte';
	import MyAccommodationTabCalendar from '@/components/pages/(protected)/host/my-accommodation/my-accommodation-tab-calendar/my-accommodation-tab-calendar.svelte';
	import MyAccommodationTabSettings from '@/components/pages/(protected)/host/my-accommodation/my-accommodation-tab-settings/my-accommodation-tab-settings.svelte';
	import { TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

	// TYPES
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<SvelteHead title={m['MyAccommodationPage.pageTitle']()} noindex />

<div class="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-10">
	{#if data.accommodation}
		<MyAccommodationHeader accommodation={data.accommodation} />

		<TabsUrl param="tab" defaultValue="listing" class="gap-7">
			<div class="border-b">
				<TabsList
					variant="line"
					class="h-12 w-full justify-start gap-3 sm:w-fit sm:gap-8"
					aria-label={m['MyAccommodationPage.MyAccommodationTabs.label']()}
				>
					<TabsTrigger value="listing">
						{m['MyAccommodationPage.MyAccommodationTabs.listing']()}
					</TabsTrigger>

					<TabsTrigger value="calendar">
						{m['MyAccommodationPage.MyAccommodationTabs.calendar']()}
					</TabsTrigger>

					<TabsTrigger value="settings">
						{m['MyAccommodationPage.MyAccommodationTabs.settings']()}
					</TabsTrigger>
				</TabsList>
			</div>

			<TabsContent value="listing" class="data-[state=inactive]:hidden">
				<MyAccommodationTabListing />
			</TabsContent>

			<TabsContent value="calendar">
				<MyAccommodationTabCalendar />
			</TabsContent>

			<TabsContent value="settings">
				<MyAccommodationTabSettings />
			</TabsContent>
		</TabsUrl>
	{:else}
		<EmptyData
			title={m['MyAccommodationPage.notFound']()}
			description={m['MyAccommodationPage.notFoundHint']()}
		/>
	{/if}
</div>

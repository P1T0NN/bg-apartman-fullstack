<script lang="ts">
	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';
	import { Button } from '@/components/ui/button/index.js';

	// CONFIG
	import { m } from '@/lib/paraglide/messages';
</script>

<div class="flex max-w-5xl flex-col gap-10">
	<section
		class="grid gap-5 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10"
		aria-labelledby="financial-title"
	>
		<div>
			<h2 id="financial-title" class="text-lg font-semibold">
				{m['MyAccommodationPage.MyAccommodationTabSettings.financial']()}
			</h2>
			<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
				{m['MyAccommodationPage.MyAccommodationTabSettings.financialHint']()}
			</p>
		</div>
		<div class="overflow-hidden rounded-xl border">
			<div class="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-5 py-4">
				<h3 class="font-medium">
					{m['MyAccommodationPage.MyAccommodationTabSettings.billingOverview']()}
				</h3>
				<Badge variant="outline"
					>{m['MyAccommodationPage.MyAccommodationTabSettings.notConfigured']()}</Badge
				>
			</div>
			<dl class="grid gap-x-6 gap-y-5 p-5 sm:grid-cols-2">
				<div>
					<dt class="text-sm text-muted-foreground">
						{m['MyAccommodationPage.MyAccommodationTabSettings.plan']()}
					</dt>
					<dd class="mt-1 font-medium">
						{m['MyAccommodationPage.MyAccommodationTabSettings.notConfigured']()}
					</dd>
				</div>
				<div>
					<dt class="text-sm text-muted-foreground">
						{m['MyAccommodationPage.MyAccommodationTabSettings.cycle']()}
					</dt>
					<dd class="mt-1">{m['MyAccommodationPage.MyAccommodationTabSettings.notSet']()}</dd>
				</div>
				<div>
					<dt class="text-sm text-muted-foreground">
						{m['MyAccommodationPage.MyAccommodationTabSettings.amount']()}
					</dt>
					<dd class="mt-1">{m['MyAccommodationPage.MyAccommodationTabSettings.notSet']()}</dd>
				</div>
				<div>
					<dt class="text-sm text-muted-foreground">
						{m['MyAccommodationPage.MyAccommodationTabSettings.nextInvoice']()}
					</dt>
					<dd class="mt-1">{m['MyAccommodationPage.MyAccommodationTabSettings.notScheduled']()}</dd>
				</div>
				<div>
					<dt class="text-sm text-muted-foreground">
						{m['MyAccommodationPage.MyAccommodationTabSettings.paymentMethod']()}
					</dt>
					<dd class="mt-1">{m['MyAccommodationPage.MyAccommodationTabSettings.notAdded']()}</dd>
				</div>
				<div>
					<dt class="text-sm text-muted-foreground">
						{m['MyAccommodationPage.MyAccommodationTabSettings.billingContact']()}
					</dt>
					<dd class="mt-1">{m['MyAccommodationPage.MyAccommodationTabSettings.notAdded']()}</dd>
				</div>
			</dl>
			<div class="flex flex-wrap items-center justify-between gap-4 border-t px-5 py-4">
				<p class="text-sm text-muted-foreground">
					{m['MyAccommodationPage.MyAccommodationTabSettings.invoicesEmpty']()}
				</p>
				<Button variant="outline" size="sm" disabled
					><span class="icon-[lucide--receipt]" data-icon="inline-start" aria-hidden="true"
					></span>{m['MyAccommodationPage.MyAccommodationTabSettings.viewInvoices']()}</Button
				>
			</div>
		</div>
	</section>
	<section
		class="grid gap-5 border-t pt-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10"
		aria-labelledby="calendar-settings-title"
	>
		<div>
			<h2 id="calendar-settings-title" class="text-lg font-semibold">
				{m['MyAccommodationPage.MyAccommodationTabSettings.calendar']()}
			</h2>
			<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
				{m['MyAccommodationPage.MyAccommodationTabSettings.calendarHint']()}
			</p>
		</div>
		<div class="flex flex-col gap-4">
			<div class="divide-y overflow-hidden rounded-xl border">
				<div class="flex flex-wrap items-center gap-4 p-5">
					<span class="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted"
						><span class="icon-[lucide--calendar-check-2] size-5" aria-hidden="true"></span></span
					>
					<div class="flex min-w-0 flex-1 flex-col gap-1">
						<div class="flex flex-wrap items-center gap-2">
							<h3 class="font-medium">Airbnb</h3>
							<Badge variant="secondary"
								>{m['MyAccommodationPage.MyAccommodationTabSettings.syncedExample']()}</Badge
							>
						</div>
						<p class="text-sm text-muted-foreground">
							{m['MyAccommodationPage.MyAccommodationTabSettings.lastSync']()}
						</p>
					</div>
					<Button variant="outline" size="sm" disabled
						><span class="icon-[lucide--refresh-cw]" data-icon="inline-start" aria-hidden="true"
						></span>{m['MyAccommodationPage.MyAccommodationTabSettings.refresh']()}</Button
					>
				</div>
				<div class="flex flex-wrap items-center gap-4 p-5">
					<span class="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted"
						><span class="icon-[lucide--calendar-plus-2] size-5" aria-hidden="true"></span></span
					>
					<div class="flex min-w-0 flex-1 flex-col gap-1">
						<div class="flex flex-wrap items-center gap-2">
							<h3 class="font-medium">Booking.com</h3>
							<Badge variant="outline"
								>{m['MyAccommodationPage.MyAccommodationTabSettings.notConnected']()}</Badge
							>
						</div>
						<p class="text-sm text-muted-foreground">
							{m['MyAccommodationPage.MyAccommodationTabSettings.connectHint']()}
						</p>
					</div>
					<Button variant="outline" size="sm" disabled
						>{m['MyAccommodationPage.MyAccommodationTabSettings.connect']()}</Button
					>
				</div>
				<div class="flex flex-wrap items-center justify-between gap-4 bg-muted/20 p-5">
					<div>
						<h3 class="text-sm font-medium">
							{m['MyAccommodationPage.MyAccommodationTabSettings.export']()}
						</h3>
						<p class="mt-1 text-sm text-muted-foreground">
							{m['MyAccommodationPage.MyAccommodationTabSettings.exportHint']()}
						</p>
					</div>
					<Button variant="outline" size="sm" disabled
						><span class="icon-[lucide--link]" data-icon="inline-start" aria-hidden="true"
						></span>{m['MyAccommodationPage.MyAccommodationTabSettings.copyLink']()}</Button
					>
				</div>
			</div>
			<p class="max-w-prose text-xs leading-relaxed text-muted-foreground">
				{m['MyAccommodationPage.MyAccommodationTabSettings.syncHint']()}
			</p>
		</div>
	</section>
	<section
		class="grid gap-5 border-t pt-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10"
		aria-labelledby="danger-zone-title"
	>
		<div>
			<h2 id="danger-zone-title" class="text-lg font-semibold text-destructive">
				{m['MyAccommodationPage.MyAccommodationTabSettings.dangerZone']()}
			</h2>
			<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
				{m['MyAccommodationPage.MyAccommodationTabSettings.dangerHint']()}
			</p>
		</div>
		<div
			class="divide-y divide-destructive/15 overflow-hidden rounded-xl border border-destructive/25"
		>
			<div class="flex flex-wrap items-center justify-between gap-4 p-5">
				<div class="max-w-sm">
					<h3 class="font-medium">
						{m['MyAccommodationPage.MyAccommodationTabSettings.unpublish']()}
					</h3>
					<p class="mt-1 text-sm leading-relaxed text-muted-foreground">
						{m['MyAccommodationPage.MyAccommodationTabSettings.unpublishHint']()}
					</p>
				</div>
				<Button variant="outline" disabled
					>{m['MyAccommodationPage.MyAccommodationTabSettings.unpublish']()}</Button
				>
			</div>
			<div class="flex flex-wrap items-center justify-between gap-4 p-5">
				<div class="max-w-sm">
					<h3 class="font-medium">
						{m['MyAccommodationPage.MyAccommodationTabSettings.delete']()}
					</h3>
					<p class="mt-1 text-sm leading-relaxed text-muted-foreground">
						{m['MyAccommodationPage.MyAccommodationTabSettings.deleteHint']()}
					</p>
				</div>
				<Button variant="destructive" disabled
					>{m['MyAccommodationPage.MyAccommodationTabSettings.delete']()}</Button
				>
			</div>
		</div>
	</section>
</div>

<script lang="ts">
	// LIBRARIES
	import { useMutation } from 'convex-svelte';
	import { m } from '@/lib/paraglide/messages.js';
	import { api } from '@convex/_generated/api.js';

	// COMPONENTS
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import { Switch } from '@/components/ui/switch/index.js';
	import AdminAccommodationsLoyaltyDialogItem from './admin-accommodations-loyalty-dialog-item.svelte';

	// UTILS
	import { toastMessage } from '@/utils/toastMessage.js';

	// DATA
	import { LOYALTY_LEVELS } from '@/shared/features/loyalty/data/loyaltyData.js';

	// TYPES
	import type { FunctionReturnType } from 'convex/server';
	import type {
		LoyaltyServices,
		LoyaltyTier
	} from '@/shared/features/loyalty/types/loyaltyTypes.js';

	type Accommodation = FunctionReturnType<
		typeof api.tables.accommodations.queries.fetchAccommodationsAdmin.fetchAccommodationsAdmin
	>['items'][number];

	const NO_SERVICES: LoyaltyServices = { parking: false, breakfast: false, spa: false };

	let { accommodation }: { accommodation: Accommodation } = $props();

	const uid = $props.id();
	const titleId = `${uid}-title`;
	const statusSwitchId = `${uid}-status`;
	let pending = $state(false);

	const disabled = $derived(pending || accommodation.status === 'deleted');

	const updateLoyalty = useMutation(
		api.tables.accommodations.mutations.updateAccommodationLoyaltyForAdmin
			.updateAccommodationLoyaltyForAdmin
	);

	let dialog: NativeDialog;

	export function open() {
		dialog?.open();
	}

	function servicesForLevel(level: LoyaltyTier): LoyaltyServices {
		return { parking: level.parking, breakfast: level.breakfast !== 'none', spa: level.spa };
	}

	function matchesServices(
		services: LoyaltyServices | undefined,
		expected: LoyaltyServices
	): boolean {
		return (
			services?.parking === expected.parking &&
			services?.breakfast === expected.breakfast &&
			services?.spa === expected.spa
		);
	}

	const activeLevel = $derived(
		accommodation.loyaltyEligible === true
			? LOYALTY_LEVELS.find((level) =>
					matchesServices(accommodation.loyaltyServices, servicesForLevel(level))
				)?.level
			: undefined
	);

	async function persist(
		loyaltyEligible: boolean,
		loyaltyServices: LoyaltyServices,
		message: string
	) {
		if (pending) return;
		pending = true;
		try {
			await updateLoyalty({ id: accommodation._id, loyaltyEligible, loyaltyServices });
			toastMessage({ type: 'success', message });
		} catch (error) {
			toastMessage({ type: 'error', error, message: m['ErrorMessages.unexpected']() });
		} finally {
			pending = false;
		}
	}

	function setLoyaltyStatus(enabled: boolean) {
		void persist(
			enabled,
			enabled ? servicesForLevel(LOYALTY_LEVELS[0]) : NO_SERVICES,
			enabled
				? m['AdminAccommodationsPage.AdminAccommodationsLoyaltyDialog.statusEnabled']()
				: m['AdminAccommodationsPage.AdminAccommodationsLoyaltyDialog.statusDisabled']()
		);
	}

	function setLevel(level: LoyaltyTier, enabled: boolean) {
		void persist(
			true,
			enabled ? servicesForLevel(level) : NO_SERVICES,
			enabled
				? m['AdminAccommodationsPage.AdminAccommodationsLoyaltyDialog.levelEnabled']({
						level: level.level
					})
				: m['AdminAccommodationsPage.AdminAccommodationsLoyaltyDialog.levelDisabled']({
						level: level.level
					})
		);
	}
</script>

<NativeDialog bind:this={dialog} aria-labelledby={titleId}>
	{#snippet children({ id })}
		<div class="flex flex-col gap-5 p-6">
			<div class="flex flex-col gap-1">
				<h2 id={titleId} class="text-lg font-semibold">
					{m['AdminAccommodationsPage.AdminAccommodationsLoyaltyDialog.title']({
						name: accommodation.name
					})}
				</h2>
				<p class="text-sm text-muted-foreground">
					{m['AdminAccommodationsPage.AdminAccommodationsLoyaltyDialog.hint']()}
				</p>
			</div>

			<label
				class="flex cursor-pointer items-center justify-between gap-4 rounded-xl border px-4 py-3"
				for={statusSwitchId}
			>
				<span class="text-sm font-medium">
					{m['AdminAccommodationsPage.AdminAccommodationsLoyaltyDialog.status']()}
				</span>
				<Switch
					id={statusSwitchId}
					checked={accommodation.loyaltyEligible === true}
					{disabled}
					onCheckedChange={(checked) => void setLoyaltyStatus(checked)}
				/>
			</label>

			<div class="flex flex-col gap-3">
				{#each LOYALTY_LEVELS as level (level.level)}
					<AdminAccommodationsLoyaltyDialogItem
						{level}
						active={activeLevel === level.level}
						disabled={disabled || accommodation.loyaltyEligible !== true}
						onToggle={(next) => void setLevel(level, next)}
					/>
				{/each}
			</div>

			<Button type="button" variant="outline" class="self-end" commandfor={id} command="close">
				{m['AdminAccommodationsPage.AdminAccommodationsLoyaltyDialog.close']()}
			</Button>
		</div>
	{/snippet}
</NativeDialog>

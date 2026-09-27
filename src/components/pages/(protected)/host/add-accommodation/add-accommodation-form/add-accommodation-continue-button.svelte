<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// CONTEXT
	import { getAccommodationFormContext } from '@/features/accommodations/context/accommodationFormContext.js';

	// MESSAGES
	import { m } from '@/lib/paraglide/messages';

	let { errors }: { errors: Record<string, string> } = $props();
	const form = getAccommodationFormContext();
</script>

<Button
	type="button"
	class="ml-auto"
	disabled={form.state.submitting}
	onclick={() => {
		if (form.validate(errors)) form.next();
	}}>{m['AddAccommodationPage.AddAccommodationContinueButton.continue']()}</Button
>

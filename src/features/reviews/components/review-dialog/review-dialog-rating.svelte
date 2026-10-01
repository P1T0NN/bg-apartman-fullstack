<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// TYPES
	import type { CustomFieldContext } from '@/components/ui/custom-components/form/formTypes.js';

	let { context }: { context: CustomFieldContext } = $props();
</script>

<fieldset
	class="flex flex-wrap gap-2"
	disabled={context.disabled}
	aria-describedby={context.error ? 'rating-error' : undefined}
>
	<legend class="mb-2 text-sm font-medium">
		{m['ReviewsFeature.ReviewDialogRating.rating']()}
		<span aria-hidden="true" class="text-destructive">*</span>
	</legend>
	{#each [1, 2, 3, 4, 5] as rating (rating)}
		<label
			class="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 has-checked:border-primary has-checked:bg-accent has-focus-visible:outline-2 has-focus-visible:outline-offset-2"
		>
			<input
				type="radio"
				name="rating"
				value={rating}
				required
				aria-describedby={context.error ? 'rating-error' : undefined}
				checked={Number(context.values.rating) === rating}
				onchange={() => context.setValue('rating', rating)}
				class="accent-primary"
			/>
			<span>{m['ReviewsFeature.ReviewDialogRating.stars']({ rating })}</span>
		</label>
	{/each}
</fieldset>

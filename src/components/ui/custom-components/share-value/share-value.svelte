<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { m } from '@/lib/paraglide/messages';

	// UTILS
	import { toastMessage } from '@/utils/toastMessage.js';

	let {
		value,
		label
	}: {
		value: string;
		label: string;
	} = $props();

	async function copyValue(): Promise<void> {
		try {
			await navigator.clipboard.writeText(value);
			toastMessage({
				type: 'success',
				message: m['Components.CopyValue.copied']({ label })
			});
		} catch (error) {
			toastMessage({ type: 'error', error, message: m['ErrorMessages.unexpected']() });
		}
	}
</script>

<Button
	variant="outline"
	size="icon"
	onclick={copyValue}
	aria-label={m['Components.CopyValue.copy']({ label })}
>
	<span class="icon-[lucide--share-2] size-4" aria-hidden="true"></span>
</Button>

<script lang="ts">
	// MESSAGES
	import { m } from '@/lib/paraglide/messages.js';

	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';

	let { id }: { id: string } = $props();
</script>

<Card.Header>
	<Card.Title>
		<h2 {id}>{m['MyAccommodationPage.MyAccommodationTabSettingsFeesHeader.title']()}</h2>
	</Card.Title>
	<Card.Description>
		{m['MyAccommodationPage.MyAccommodationTabSettingsFeesHeader.description']()}
	</Card.Description>
</Card.Header>

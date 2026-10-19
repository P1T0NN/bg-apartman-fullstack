<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import * as Card from '@/components/ui/card/index.js';

	function setupPayouts() {
		console.log('Payout setup requested');
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>
			{m['HostSettingsPage.HostSettingsTabPayouts.title']()}
		</Card.Title>
		<Card.Description>
			{m['HostSettingsPage.HostSettingsTabPayouts.description']()}
		</Card.Description>
	</Card.Header>
	<Card.Content class="flex flex-col gap-3">
		<p id="payout-setup-status" class="text-sm text-muted-foreground" role="status">
			{m['HostSettingsPage.HostSettingsTabPayouts.pending']()}
		</p>
	</Card.Content>
	<Card.Footer class="flex flex-wrap gap-3">
		<Button onclick={setupPayouts} aria-describedby="payout-setup-status">
			{m['HostSettingsPage.HostSettingsTabPayouts.connect']()}
		</Button>
	</Card.Footer>
</Card.Root>

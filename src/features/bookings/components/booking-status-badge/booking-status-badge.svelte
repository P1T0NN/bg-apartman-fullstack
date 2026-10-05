<script lang="ts">
	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// DATA
	import { BOOKING_STATUS_LABELS } from '@/features/bookings/data/bookingStatusLabels.js';

	// TYPES
	import type { BookingStatus } from '@/shared/features/bookings/types/bookingTypes.js';

	let { status }: { status: BookingStatus } = $props();

	const STATUS_CLASSES = {
		pending: 'border-warning/30 bg-warning/10 text-warning',
		confirmed: 'border-success/30 bg-success/10 text-success',
		declined: 'border-destructive/30 bg-destructive/10 text-destructive',
		cancelled: 'border-border bg-muted text-muted-foreground',
		expired: 'border-border bg-muted text-muted-foreground',
		completed: 'border-border bg-muted text-muted-foreground'
	} satisfies Record<BookingStatus, string>;
</script>

<Badge variant="outline" class={cn(STATUS_CLASSES[status])}>
	{BOOKING_STATUS_LABELS[status]()}
</Badge>

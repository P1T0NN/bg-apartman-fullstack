// PLACEMENT
// usePopoverPlacement: keeps a NativePopover inside a container by flipping it
// before it opens. Attach `watch` to an element inside the popover, pass the
// returned `side`/`align` back to NativePopover, and use `open` for lazy
// content. `getSize` is the space the open panel needs (an estimate is fine),
// `getBounds` the container it must stay inside (defaults to the viewport),
// and `gap` the space kept between panel and bounds.

// TYPES
import type { Attachment } from 'svelte/attachments';

export type PopoverSide = 'top' | 'bottom';
export type PopoverAlign = 'start' | 'end';

export type PopoverBounds = {
	top: number;
	left: number;
	right: number;
	bottom: number;
};

export type PopoverPlacementOptions = {
	/** Space the open popover needs; size decisions flip when it does not fit. */
	getSize: () => { width: number; height: number };
	/** Container the popover must stay inside; defaults to the viewport. */
	getBounds?: (trigger: HTMLElement) => PopoverBounds | null;
	/** Space kept between the popover and the bounds. */
	gap?: number;
};

export function usePopoverPlacement(options: PopoverPlacementOptions) {
	const gap = options.gap ?? 8;

	let side = $state<PopoverSide>('bottom');
	let align = $state<PopoverAlign>('end');
	let open = $state(false);

	function viewportBounds(): PopoverBounds {
		return { top: 0, left: 0, right: window.innerWidth, bottom: window.innerHeight };
	}

	function chooseSide(roomAbove: number, roomBelow: number, height: number): PopoverSide {
		if (roomAbove >= height + gap) return 'top';
		if (roomBelow >= height + gap) return 'bottom';
		return roomAbove > roomBelow ? 'top' : 'bottom';
	}

	function chooseAlign(roomLeft: number, roomRight: number, width: number): PopoverAlign {
		if (roomLeft >= width + gap) return 'end';
		if (roomRight >= width + gap) return 'start';
		return roomLeft > roomRight ? 'end' : 'start';
	}

	function update(popover: HTMLElement): void {
		const trigger = popover.parentElement?.querySelector<HTMLElement>(
			`[popovertarget="${popover.id}"]`
		);
		if (!trigger) return;

		const { width, height } = options.getSize();
		const bounds = options.getBounds?.(trigger) ?? viewportBounds();
		const triggerRect = trigger.getBoundingClientRect();

		side = chooseSide(triggerRect.top - bounds.top, bounds.bottom - triggerRect.bottom, height);
		align = chooseAlign(triggerRect.right - bounds.left, bounds.right - triggerRect.right, width);
	}

	const watch: Attachment<HTMLElement> = (node) => {
		const popover = node.closest<HTMLElement>('[popover]');
		if (!popover) return;

		const onToggle = (event: ToggleEvent) => {
			if (event.newState === 'open') update(popover);
			open = event.newState === 'open';
		};
		popover.addEventListener('beforetoggle', onToggle);
		return () => popover.removeEventListener('beforetoggle', onToggle);
	};

	return {
		get side() {
			return side;
		},
		get align() {
			return align;
		},
		get open() {
			return open;
		},
		watch
	};
}

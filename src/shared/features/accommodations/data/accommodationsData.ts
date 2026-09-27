export const AMENITIES = [
	{ key: 'wifi', group: 'essentials', icon: 'icon-[lucide--wifi]' },
	{ key: 'kitchen', group: 'essentials', icon: 'icon-[lucide--cooking-pot]' },
	{ key: 'air-conditioning', group: 'essentials', icon: 'icon-[lucide--snowflake]' },
	{ key: 'heating', group: 'essentials', icon: 'icon-[lucide--heater]' },
	{ key: 'towels', group: 'essentials', icon: 'icon-[lucide--bath]' },
	{ key: 'washer', group: 'essentials', icon: 'icon-[lucide--washing-machine]' },
	{ key: 'workspace', group: 'work', icon: 'icon-[lucide--monitor]' },
	{ key: 'tv', group: 'work', icon: 'icon-[lucide--tv]' },
	{ key: 'parking', group: 'outdoors', icon: 'icon-[lucide--car-front]' },
	{ key: 'elevator', group: 'outdoors', icon: 'icon-[lucide--arrow-up-down]' },
	{ key: 'garden', group: 'outdoors', icon: 'icon-[lucide--trees]' },
	{ key: 'pool', group: 'outdoors', icon: 'icon-[lucide--waves]' }
] as const;

export const AMENITY_KEYS = AMENITIES.map((amenity) => amenity.key);

export const POPULAR_AMENITY_KEYS = [
	'wifi',
	'parking',
	'kitchen',
	'air-conditioning',
	'pool',
	'washer',
	'tv',
	'heating'
] as const satisfies readonly (typeof AMENITIES)[number]['key'][];

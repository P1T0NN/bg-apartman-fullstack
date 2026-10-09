export const LOYALTY_LEVELS = [
	{ level: 1, stays: 2, discount: 10, parking: true, breakfast: 'none', spa: false },
	{ level: 2, stays: 5, discount: 15, parking: true, breakfast: 'up_to_two', spa: false },
	{ level: 3, stays: 8, discount: 20, parking: true, breakfast: 'all', spa: true }
] as const;

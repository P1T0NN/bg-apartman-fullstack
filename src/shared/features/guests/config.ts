/** Browser continuity for guests. The id is untrusted and never authorizes a booking. */
export const GUESTS_CONFIG = {
	/** localStorage key holding the browser's guest association id. */
	STORAGE_KEY: 'bg-apartman:guest-id'
} as const;

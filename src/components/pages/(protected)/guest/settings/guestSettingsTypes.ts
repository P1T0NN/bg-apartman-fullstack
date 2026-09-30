/** Signed-in user summary supplied by the root layout (`api.auth.getCurrentUser`). */
export type GuestSettingsUser = {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	image?: string | null;
};

/** Session row from better-auth's `listSessions`, with dates normalized to milliseconds. */
export type GuestSession = {
	id: string;
	token: string;
	createdAt: number;
	updatedAt: number;
	expiresAt: number;
	ipAddress?: string | null;
	userAgent?: string | null;
};

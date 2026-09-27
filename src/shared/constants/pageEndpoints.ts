// SVELTEKIT IMPORTS
import { resolve } from '$app/paths';

export const PROTECTED_PAGE_ENDPOINTS = {
	HOST_DASHBOARD: resolve('/host/dashboard'),
	ADD_ACCOMMODATION: resolve('/host/add-accommodation'),
	MY_ACCOMMODATIONS: resolve('/host/my-accommodations'),
	MY_ACCOMMODATION: (id: string) => resolve(`/host/my-accommodations/${id}`),
	HOST_BOOKINGS: resolve('/host/bookings'),
	CLAIM_BOOKING: resolve('/guest/claim-booking'),
	FAVORITES: resolve('/guest/favorites'),
	MY_BOOKINGS: resolve('/guest/my-bookings'),
	MY_BOOKING: (id: string) => resolve(`/guest/my-bookings/${id}`),
	GUEST_SETTINGS: resolve('/guest/settings')
};

export const UNPROTECTED_PAGE_ENDPOINTS = {
	ROOT: resolve('/'),
	SEARCH: resolve('/search'),
	ACCOMMODATION: (id: string) => resolve(`/accommodation/${id}`),
	BOOK_ACCOMMODATION: (id: string) => resolve(`/accommodation/${id}/book`),
	BOOK_CONFIRMATION: (id: string) => resolve(`/book-confirmation/${id}`),
	FIND_BOOKING: resolve('/find-booking'),
	HELP: resolve('/help'),
	CONTACT: resolve('/contact'),
	SIGN_IN: resolve('/sign-in'),
	SIGN_UP: resolve('/sign-up'),
	VERIFY_EMAIL: resolve('/verify-email'),
	FORGOT_PASSWORD: resolve('/forgot-password'),
	AUTH_ERROR: resolve('/auth/error')
};

export const ADMIN_PAGE_ENDPOINTS = {
	DASHBOARD: resolve('/admin/dashboard'),
	USERS: resolve('/admin/users'),
	USER: (id: string) => resolve(`/admin/users/${id}`),
	LOGS: resolve('/admin/logs'),
	ACCOMMODATIONS: resolve('/admin/accommodations'),
	NEWSLETTERS: resolve('/admin/newsletters'),
	FEEDBACK: resolve('/admin/feedback')
};

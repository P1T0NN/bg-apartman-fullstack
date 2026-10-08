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
	MY_REVIEWS: resolve('/guest/my-reviews'),
	MY_BENEFITS: resolve('/guest/benefits'),
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
	HELP_FOR_HOSTS: resolve('/help/for-hosts'),
	HELP_FIND_AND_BOOK: resolve('/help/find-and-book'),
	HELP_BOOKING: resolve('/help/booking'),
	HELP_CLAIM_BOOKING: resolve('/help/claim-booking'),
	HELP_REVIEWS: resolve('/help/reviews'),
	HELP_ACCOUNT: resolve('/help/account'),
	HELP_TIMEZONE: resolve('/help/timezone'),
	HELP_CANCELLATION_POLICY: resolve('/help/cancellation-policy'),
	CONTACT: resolve('/contact'),
	FEEDBACK: resolve('/feedback'),
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
	FEEDBACK: resolve('/admin/feedback'),
	REVIEWS: resolve('/admin/reviews')
};

// CONFIG
import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

export const HELP_TOPICS = [
	{
		href: UNPROTECTED_PAGE_ENDPOINTS.HELP_FOR_HOSTS,
		labelKey: 'HelpPage.topics.forHosts',
		descriptionKey: 'HelpPage.topicDescriptions.forHosts',
		icon: 'icon-[lucide--house]'
	},
	{
		href: UNPROTECTED_PAGE_ENDPOINTS.HELP_FIND_AND_BOOK,
		labelKey: 'HelpPage.topics.findAndBook',
		descriptionKey: 'HelpPage.topicDescriptions.findAndBook',
		icon: 'icon-[lucide--search]'
	},
	{
		href: UNPROTECTED_PAGE_ENDPOINTS.HELP_BOOKING,
		labelKey: 'HelpPage.topics.booking',
		descriptionKey: 'HelpPage.topicDescriptions.booking',
		icon: 'icon-[lucide--calendar-check]'
	},
	{
		href: UNPROTECTED_PAGE_ENDPOINTS.HELP_CLAIM_BOOKING,
		labelKey: 'HelpPage.topics.claimBooking',
		descriptionKey: 'HelpPage.topicDescriptions.claimBooking',
		icon: 'icon-[lucide--link]'
	},
	{
		href: UNPROTECTED_PAGE_ENDPOINTS.HELP_REVIEWS,
		labelKey: 'HelpPage.topics.reviews',
		descriptionKey: 'HelpPage.topicDescriptions.reviews',
		icon: 'icon-[lucide--star]'
	},
	{
		href: UNPROTECTED_PAGE_ENDPOINTS.HELP_ACCOUNT,
		labelKey: 'HelpPage.topics.account',
		descriptionKey: 'HelpPage.topicDescriptions.account',
		icon: 'icon-[lucide--user-round]'
	},
	{
		href: UNPROTECTED_PAGE_ENDPOINTS.HELP_CANCELLATION_POLICY,
		labelKey: 'HelpPage.topics.cancellationPolicy',
		descriptionKey: 'HelpPage.topicDescriptions.cancellationPolicy',
		icon: 'icon-[lucide--calendar-x-2]'
	},
	{
		href: UNPROTECTED_PAGE_ENDPOINTS.HELP_TIMEZONE,
		labelKey: 'HelpPage.topics.timezone',
		descriptionKey: 'HelpPage.topicDescriptions.timezone',
		icon: 'icon-[lucide--clock]'
	}
] as const;

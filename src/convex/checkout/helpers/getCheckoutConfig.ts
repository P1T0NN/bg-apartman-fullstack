// CONVEX
import { env } from '../../_generated/server.js';

export function getCheckoutConfig() {
	const secret = env.CHECKOUT_API_SECRET;
	const baseUrl = env.CHECKOUT_API_BASE_URL?.replace(/\/$/, '');
	const channelId = env.CHECKOUT_PROCESSING_CHANNEL_ID;
	const isSandbox =
		secret?.startsWith('sk_sbox_') &&
		baseUrl &&
		/^https:\/\/[a-z0-9-]+\.api\.sandbox\.checkout\.com$/.test(baseUrl) &&
		channelId &&
		/^pc_[A-Za-z0-9_]{26}$/.test(channelId);
	if (!isSandbox) throw new Error('Checkout.com sandbox configuration is missing or invalid');
	return { secret, baseUrl, channelId };
}

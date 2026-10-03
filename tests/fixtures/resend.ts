import resendTest from '@convex-dev/resend/test';
import workpoolTest from '@convex-dev/workpool/test';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import type { TestConvex } from 'convex-test';
import schema from '../../src/convex/schema';

/** Register the component and its nested workers so tests exercise the actual retry queue. */
export function registerResend(t: TestConvex<typeof schema>) {
	resendTest.register(t);
	rateLimiterTest.register(t, 'resend/rateLimiter');
	workpoolTest.register(t, 'resend/emailWorkpool');
	workpoolTest.register(t, 'resend/callbackWorkpool');
}

export function successfulResendResponse(body: BodyInit | null | undefined) {
	const messages = JSON.parse(String(body));
	return new Response(
		JSON.stringify({
			data: messages.map((_: { to: string[] }, index: number) => ({
				id: `provider-${index}-${crypto.randomUUID()}`
			}))
		}),
		{ status: 200, headers: { 'Content-Type': 'application/json' } }
	);
}

export async function emailStatuses(
	t: TestConvex<typeof schema>,
	ids:
		| { guest?: import('@convex-dev/resend').EmailId; host?: import('@convex-dev/resend').EmailId }
		| undefined
) {
	const { resend } = await import('../../src/convex/emails/sendEmail');
	return Object.fromEntries(
		await Promise.all(
			Object.entries(ids ?? {}).map(async ([recipient, emailId]) => [
				recipient,
				(await t.run((ctx) => resend.status(ctx, emailId)))?.status
			])
		)
	);
}

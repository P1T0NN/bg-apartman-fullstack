// LIBRARIES
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

// UTILS
import {
	formValidationErrors,
	getFormValue,
	setFormValue
} from '../src/components/ui/custom-components/form/formValues.js';

describe('form submission values', () => {
	it('edits nested fields without changing initial data or dropping sibling fields', () => {
		const initial = { shippingAddress: { country: 'FR', street: 'Old street' }, email: 'a@b.com' };
		const edited = setFormValue(initial, 'shippingAddress.street', 'New street');
		expect(getFormValue(edited, 'shippingAddress.street')).toBe('New street');
		expect(getFormValue(edited, 'shippingAddress.country')).toBe('FR');
		expect(getFormValue(edited, 'shippingAddress.apartment')).toBeUndefined();
		expect(initial.shippingAddress.street).toBe('Old street');
		expect(setFormValue({}, 'shippingAddress.city', 'Paris')).toEqual({
			shippingAddress: { city: 'Paris' }
		});
		expect(setFormValue(edited, 'shippingAddress', undefined)).toEqual({
			shippingAddress: undefined,
			email: 'a@b.com'
		});
	});

	it('validates external values and submits parsed defaults, coercions, and async transforms', async () => {
		const schema = z.object({
			email: z.email().transform(async (email) => email.toLowerCase()),
			quantity: z.coerce.number().int().positive(),
			customerRef: z.string().min(1),
			items: z
				.array(
					z.object({ productVariantId: z.string().min(1), quantity: z.number().int().positive() })
				)
				.min(1),
			done: z.boolean().default(false)
		});
		const values = {
			email: 'HELLO@example.com',
			quantity: '2',
			customerRef: 'stale',
			uiOnly: true
		};
		const extraFields = {
			customerRef: 'current',
			items: [{ productVariantId: 'variant', quantity: 3 }]
		};
		const parsed = await schema.safeParseAsync({ ...values, ...extraFields });
		expect(parsed).toEqual({
			success: true,
			data: { email: 'hello@example.com', quantity: 2, ...extraFields, done: false }
		});
		expect(values.quantity).toBe('2');
		expect(values.customerRef).toBe('stale');
		extraFields.customerRef = '';
		expect((await schema.safeParseAsync({ ...values, ...extraFields })).success).toBe(false);
	});

	it('lets a discriminated schema omit a previously entered delivery address for pickup', async () => {
		const common = z.object({ firstName: z.string().min(1) });
		const schema = z.discriminatedUnion('fulfillmentMethod', [
			common.extend({
				fulfillmentMethod: z.literal('delivery'),
				shippingAddress: z.object({
					street: z.string().min(1),
					apartment: z
						.string()
						.optional()
						.transform((value) => value || undefined)
				})
			}),
			common.extend({ fulfillmentMethod: z.literal('pickup') })
		]);
		let values = setFormValue(
			{ firstName: 'Ada', fulfillmentMethod: 'delivery' },
			'shippingAddress.street',
			'Main street'
		);
		values = setFormValue(values, 'shippingAddress.apartment', '');
		expect(await schema.safeParseAsync(values)).toEqual({
			success: true,
			data: {
				firstName: 'Ada',
				fulfillmentMethod: 'delivery',
				shippingAddress: { street: 'Main street', apartment: undefined }
			}
		});
		values = setFormValue(values, 'fulfillmentMethod', 'pickup');
		expect(await schema.safeParseAsync(values)).toEqual({
			success: true,
			data: { firstName: 'Ada', fulfillmentMethod: 'pickup' }
		});
		expect(getFormValue(values, 'shippingAddress.street')).toBe('Main street');
	});

	it('keeps nested, checkbox, external, and form-wide validation errors visible', async () => {
		const schema = z
			.object({
				shippingAddress: z.object({ street: z.string().min(2).regex(/x/) }),
				consent: z.literal(true),
				customerRef: z.string().min(1)
			})
			.refine(() => false, 'CHECKOUT_UNAVAILABLE');
		const parsed = await schema.safeParseAsync({
			shippingAddress: { street: '' },
			consent: true,
			customerRef: ''
		});
		expect(parsed.success).toBe(false);
		if (parsed.success) throw new Error('Expected validation failure');
		const errors = formValidationErrors(parsed.error.issues);
		expect(Object.keys(errors)).toEqual(['shippingAddress.street', 'customerRef', '']);
		expect(errors['']).toBe('CHECKOUT_UNAVAILABLE');
		expect(errors['shippingAddress.street']).toBe(parsed.error.issues[0].message);
		const checkbox = await z.object({ consent: z.literal(true) }).safeParseAsync({
			consent: false
		});
		if (checkbox.success) throw new Error('Expected checkbox validation failure');
		expect(formValidationErrors(checkbox.error.issues).consent).toBeTruthy();
	});


	it('rejects unsafe paths and refuses to overwrite scalar or array parents', () => {
		for (const name of [
			'__proto__.polluted',
			'constructor.prototype.polluted',
			'address..street',
			''
		]) {
			expect(() => setFormValue({}, name, true)).toThrow('Invalid form field path');
			expect(() => getFormValue({}, name)).toThrow('Invalid form field path');
		}
		expect(getFormValue({}, 'toString')).toBeUndefined();
		expect(() => setFormValue({ address: 'existing' }, 'address.street', 'new')).toThrow(
			'non-object'
		);
		expect(() => setFormValue({ items: [] }, 'items.0', 'new')).toThrow('non-object');
		expect(Object.hasOwn(Object.prototype, 'polluted')).toBe(false);
	});
});

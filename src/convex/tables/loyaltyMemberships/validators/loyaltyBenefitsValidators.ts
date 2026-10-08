import { literals } from 'convex-helpers/validators';
import { v } from 'convex/values';

export const loyaltyLevelValidator = literals(0, 1, 2, 3);
export const loyaltyServicesValidator = v.object({
	parking: v.boolean(),
	breakfast: v.boolean(),
	spa: v.boolean()
});
export const loyaltyDiscountModeValidator = literals('best', 'stack');
export const loyaltyBookingBenefitsValidator = v.object({
	level: literals(1, 2, 3),
	discountMode: loyaltyDiscountModeValidator,
	propertyDiscountBps: v.number(),
	loyaltyDiscountBps: v.number(),
	propertySavingsMinor: v.number(),
	loyaltySavingsMinor: v.number(),
	parking: v.boolean(),
	breakfast: literals('none', 'up_to_two', 'all'),
	breakfastGuests: v.number(),
	spa: v.boolean()
});

export const bookingBenefitsContextValidator = v.object({
	level: loyaltyLevelValidator,
	services: v.union(loyaltyServicesValidator, v.null()),
	discountMode: v.union(loyaltyDiscountModeValidator, v.null())
});

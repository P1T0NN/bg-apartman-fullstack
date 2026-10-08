export const loyaltyBookingBenefitsTranslation = {
	en: {
		level: (level: number) => `Loyalty benefits — Level ${level}`,
		propertyDiscount: (percent: number, amount: string) =>
			`Property discount (${percent}%): −${amount}`,
		loyaltyDiscount: (percent: number, amount: string) =>
			`Loyalty discount (${percent}%): −${amount}`,
		parking: 'Free parking',
		breakfastTwo: 'Free breakfast for up to 2 people',
		breakfastAll: 'Free breakfast for all guests',
		breakfastGuests: (count: number) =>
			`Breakfast covers ${count} booked ${count === 1 ? 'guest' : 'guests'}`,
		spa: 'Free spa access',
		total: (amount: string) => `Total stay price: ${amount}`
	}
};

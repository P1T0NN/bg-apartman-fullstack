export type TimeSlot = { value: string; label: string };

/** Every half-hour slot of the day, from 00:00 to 23:30. */
export function getTimeSlots(): TimeSlot[] {
	const slots: TimeSlot[] = [];
	for (let minutes = 0; minutes < 24 * 60; minutes += 30) {
		const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
		const value = `${hours}:${String(minutes % 60).padStart(2, '0')}`;
		slots.push({ value, label: value });
	}
	return slots;
}

// LIBRARIES
import {
	getLocalTimeZone,
	parseDate,
	type CalendarDate,
	type DateValue
} from '@internationalized/date';

// UTILS
import { linearFind } from '../lib/algorithms/index.js';

export const DAY_IN_MS = 86_400_000;

const relativeTimeUnits = [
	['year', 365 * 24 * 60 * 60 * 1000],
	['month', 30 * 24 * 60 * 60 * 1000],
	['week', 7 * 24 * 60 * 60 * 1000],
	['day', 24 * 60 * 60 * 1000],
	['hour', 60 * 60 * 1000],
	['minute', 60 * 1000],
	['second', 1000]
] as const;

export function formatDate(timestamp: number, locale: string): string {
	return new Intl.DateTimeFormat(locale, {
		dateStyle: 'medium',
		timeZone: 'UTC'
	}).format(timestamp);
}

export function formatDateTime(timestamp: number, locale: string): string {
	return new Intl.DateTimeFormat(locale, {
		dateStyle: 'medium',
		timeStyle: 'short',
		timeZone: 'UTC'
	}).format(timestamp);
}

export function toIsoDate(date: DateValue): string {
	return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
}

export function parseIsoDate(value: string | null | undefined): CalendarDate | undefined {
	if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
	try {
		return parseDate(value);
	} catch {
		return undefined;
	}
}

export function startOfDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function endOfDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function daysInRange(start: DateValue, end: DateValue): number {
	const startTime = start.toDate(getLocalTimeZone()).getTime();
	const endTime = end.toDate(getLocalTimeZone()).getTime();
	return Math.round((endTime - startTime) / DAY_IN_MS) + 1;
}

export function formatRelativeTime(timestamp: number, locale: string, now = Date.now()): string {
	const difference = timestamp - now;
	const absoluteDifference = Math.abs(difference);
	const [unit, milliseconds] =
		linearFind(relativeTimeUnits, ([, duration]) => absoluteDifference >= duration) ??
		relativeTimeUnits.at(-1)!;

	return new Intl.RelativeTimeFormat(locale, {
		numeric: 'auto',
		style: 'narrow'
	}).format(Math.trunc(difference / milliseconds), unit);
}

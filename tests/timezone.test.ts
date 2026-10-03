// @vitest-environment node
import { readFileSync } from 'node:fs';
import { afterEach, expect, test, vi } from 'vitest';

const data = readFileSync(new URL('../node_modules/lltz/data/timezones.lltz', import.meta.url));
afterEach(() => {
	vi.unstubAllGlobals();
	vi.resetModules();
});

test('browser lookup resolves real boundaries and reuses one download for concurrent pins', async () => {
	const fetchMock = vi.fn(async () => new Response(data));
	vi.stubGlobal('fetch', fetchMock);
	const { getTimeZone } = await import('../src/features/timezone/utils/getTimeZone.js');
	const zones = await Promise.all([
		getTimeZone({ latitude: 44.8176, longitude: 20.4633 }),
		getTimeZone({ latitude: 40.7128, longitude: -74.006 }),
		getTimeZone({ latitude: 27.7172, longitude: 85.324 })
	]);
	expect(zones).toEqual(['Europe/Belgrade', 'America/New_York', 'Asia/Kathmandu']);
	expect(fetchMock).toHaveBeenCalledTimes(1);
	await expect(getTimeZone({ latitude: 45.815, longitude: 15.982 })).resolves.toBe('Europe/Zagreb');
	expect(fetchMock).toHaveBeenCalledTimes(1);
});

test('invalid coordinates never start the boundary download', async () => {
	const fetchMock = vi.fn();
	vi.stubGlobal('fetch', fetchMock);
	const { getTimeZone } = await import('../src/features/timezone/utils/getTimeZone.js');
	for (const coordinates of [
		{ latitude: 91, longitude: 20 },
		{ latitude: 44, longitude: -181 },
		{ latitude: Number.NaN, longitude: 20 }
	]) {
		await expect(getTimeZone(coordinates)).rejects.toThrow();
	}
	expect(fetchMock).not.toHaveBeenCalled();
});

test('failed downloads can be retried without retaining a rejected lookup', async () => {
	const fetchMock = vi
		.fn()
		.mockResolvedValueOnce(new Response('', { status: 503 }))
		.mockImplementation(async () => new Response(data));
	vi.stubGlobal('fetch', fetchMock);
	const { getTimeZone } = await import('../src/features/timezone/utils/getTimeZone.js');
	await expect(getTimeZone({ latitude: 44.8176, longitude: 20.4633 })).rejects.toThrow(
		'TIME_ZONE_UNAVAILABLE'
	);
	await expect(getTimeZone({ latitude: 44.8176, longitude: 20.4633 })).resolves.toBe(
		'Europe/Belgrade'
	);
	expect(fetchMock).toHaveBeenCalledTimes(2);
});

test('overlapping timezones are rejected instead of silently choosing one', async () => {
	vi.stubGlobal(
		'fetch',
		vi.fn(async () => new Response(data))
	);
	const { getTimeZone } = await import('../src/features/timezone/utils/getTimeZone.js');
	await expect(getTimeZone({ latitude: 43.839, longitude: 87.526 })).rejects.toThrow(
		'AMBIGUOUS_TIME_ZONE'
	);
});

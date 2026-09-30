// LIBRARIES
import { execFile, spawn } from 'node:child_process';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import assert from 'node:assert/strict';

// TYPES
import type { FunctionArgs } from 'convex/server';
import type { api, internal } from '../src/convex/_generated/api.js';

const execute = promisify(execFile);
const delay = (ms: number) => new Promise((done) => setTimeout(done, ms));
const baseUrl = process.env.BENCHMARK_APP_URL ?? 'http://localhost:5173';
const readOnly = process.argv.includes('--read-only');
const repetitions = Number(process.env.BENCHMARK_REPETITIONS ?? 20);
const densities = readOnly
	? [0]
	: (process.env.BENCHMARK_DENSITIES ?? '100,1000,10000').split(',').map(Number);
assert(Number.isSafeInteger(repetitions) && repetitions >= 2, 'Use at least two repetitions.');
assert(readOnly || densities.every((n) => Number.isSafeInteger(n) && n > 0 && n <= 100_000));
const envFile = await readFile('.env.local', 'utf8');
const deployment = /^CONVEX_DEPLOYMENT=dev:([^\s#]+)/m.exec(envFile)?.[1];
assert(deployment, 'Benchmark requires a configured dev deployment in .env.local.');
const ownerId = `search-map-benchmark-${Date.now()}`;
if (!readOnly) console.log(`Benchmark fixture owner: ${ownerId}`);

type SeedArgs = FunctionArgs<typeof internal.seed.seedAccommodations>;
type ClearArgs = FunctionArgs<typeof internal.seed.clearSeededAccommodations>;
type MapArgs = FunctionArgs<
	typeof api.tables.accommodations.queries.fetchAccommodationsMapSearch.fetchAccommodationsMap
>;

async function convexRun(name: string, args: SeedArgs | ClearArgs | MapArgs) {
	const { stdout } = await execute(
		process.execPath,
		[
			'node_modules/convex/bin/main.js',
			'run',
			'--deployment',
			deployment!,
			name,
			JSON.stringify(args)
		],
		{ windowsHide: true, maxBuffer: 4 * 1024 * 1024, timeout: 120_000 }
	);
	return JSON.parse(stdout);
}

// Fail before opening a browser or writing fixtures if CLI access is unavailable.
if (!readOnly)
	await convexRun(
		'tables/accommodations/queries/fetchAccommodationsMapSearch:fetchAccommodationsMap',
		{
			location: {},
			paginationOpts: { cursor: null, numItems: 500 }
		}
	);
const pageResponse = await fetch(`${baseUrl}/__benchmarks/search-map`);
assert(pageResponse.ok, 'Start bun run dev before running the benchmark.');

type ExecutionLog = {
	kind: string;
	identifier: string;
	timestamp: number;
	executionTimestamp: number;
	executionTime: number;
	usageStats: { databaseReadDocuments: number };
};
type Sample = {
	startedAt: number;
	finishedAt: number;
	queryCalls: number;
	responseBytes: number;
	queryMs: number;
	markerCount: number;
	listCount: number;
	renderMs: number;
	viewportUpdateMs: number;
	userAgent: string;
};
const executionLogs: ExecutionLog[] = [];
const logs = readOnly
	? undefined
	: spawn(
			process.execPath,
			[
				'node_modules/convex/bin/main.js',
				'logs',
				'--deployment',
				deployment,
				'--success',
				'--jsonl'
			],
			{
				windowsHide: true,
				stdio: ['ignore', 'pipe', 'pipe']
			}
		);
let pendingLog = '';
logs?.stdout.on('data', (chunk: Buffer) => {
	pendingLog += chunk.toString();
	const lines = pendingLog.split('\n');
	pendingLog = lines.pop() ?? '';
	for (const line of lines) {
		if (!line.trim()) continue;
		try {
			const entry: ExecutionLog = JSON.parse(line);
			const isMapCompletion =
				entry.kind === 'Completion' &&
				entry.identifier?.endsWith('fetchAccommodationsMapSearch:fetchAccommodationsMap');
			if (isMapCompletion) executionLogs.push(entry);
		} catch {
			console.warn('Ignored a non-JSON Convex log line.');
		}
	}
});
logs?.stderr.on('data', (chunk: Buffer) => process.stderr.write(chunk));

// Use the installed browser and its native debugging protocol; no new dependency.
const profile = await mkdtemp(join(tmpdir(), 'bg-search-map-'));
const edge = spawn(
	process.env.BENCHMARK_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
	[
		'--headless=new',
		'--remote-debugging-port=0',
		`--user-data-dir=${profile}`,
		'--no-first-run',
		'--disable-extensions',
		'about:blank'
	],
	{ windowsHide: true, stdio: 'ignore' }
);
let browserError: Error | undefined;
edge.on('error', (error) => {
	browserError = error;
});
let socket: WebSocket | undefined;
let commandId = 0;
type DebugResult = {
	result?: { value?: Sample | boolean; description?: string };
	exceptionDetails?: object;
};
const commands = new Map<
	number,
	{ resolve: (value: DebugResult) => void; reject: (error: Error) => void }
>();

type DebugParams = {
	source?: string;
	url?: string;
	expression?: string;
	returnByValue?: boolean;
	awaitPromise?: boolean;
	rate?: number;
	width?: number;
	height?: number;
	deviceScaleFactor?: number;
	mobile?: boolean;
};

async function command(method: string, params: DebugParams = {}): Promise<DebugResult> {
	const id = ++commandId;
	const timer = setTimeout(() => {
		commands.get(id)?.reject(new Error(`Browser command timed out: ${method}`));
		commands.delete(id);
	}, 130_000);
	return new Promise<DebugResult>((resolveCommand, reject) => {
		commands.set(id, { resolve: resolveCommand, reject });
		socket!.send(JSON.stringify({ id, method, params }));
	}).finally(() => clearTimeout(timer));
}

const results: object[] = [];
try {
	const deadline = Date.now() + 15_000;
	while (true) {
		if (browserError) throw browserError;
		try {
			const debugPort = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split(
				'\n'
			)[0];
			const response = await fetch(`http://localhost:${debugPort}/json/new?about:blank`, {
				method: 'PUT'
			});
			const target: { webSocketDebuggerUrl: string } = await response.json();
			socket = new WebSocket(target.webSocketDebuggerUrl);
			await new Promise<void>((done, reject) => {
				socket!.onopen = () => done();
				socket!.onerror = () => reject(new Error('Browser debugger failed to connect.'));
			});
			break;
		} catch (cause) {
			if (Date.now() > deadline) throw cause;
			await delay(100);
		}
	}
	socket.onmessage = (event) => {
		const message: {
			id?: number;
			result: DebugResult;
			error?: { message: string };
			method?: string;
			params?: {
				frame?: { url: string };
				exceptionDetails?: { text: string; exception?: { description: string } };
			};
		} = JSON.parse(String(event.data));
		if (message.method === 'Page.frameNavigated')
			console.log(`Browser page: ${message.params?.frame?.url}`);
		if (message.method === 'Runtime.exceptionThrown')
			console.error(message.params?.exceptionDetails);
		if (!message.id) return;
		const pending = commands.get(message.id);
		commands.delete(message.id);
		if (message.error) pending?.reject(new Error(message.error.message));
		else pending?.resolve(message.result);
	};
	socket.onclose = () => {
		for (const pending of commands.values())
			pending.reject(new Error('Browser connection closed.'));
		commands.clear();
	};
	await command('Page.enable');
	await command('Runtime.enable');
	// Keep a stable page while profiling; Vite dependency discovery can reload it.
	await command('Page.addScriptToEvaluateOnNewDocument', {
		source: `window.WebSocket = new Proxy(window.WebSocket, {
			construct(Target, args) {
				const socket = Reflect.construct(Target, args);
				if (args[1] === 'vite-hmr') {
					socket.addEventListener('message', (event) => event.stopImmediatePropagation());
				}
				return socket;
			}
		});`
	});
	await command('Page.navigate', { url: `${baseUrl}/__benchmarks/search-map` });
	const readyDeadline = Date.now() + 60_000;
	while (true) {
		const ready = await command('Runtime.evaluate', {
			expression:
				"Boolean(window.searchMapBenchmark && document.querySelector('pre')?.textContent?.startsWith('Ready.'))",
			returnByValue: true
		});
		if (ready.result?.value) break;
		assert(
			Date.now() < readyDeadline,
			'Map did not initialize. Check the Google Maps key and browser console.'
		);
		await delay(250);
	}
	let seeded = 0;
	for (const density of densities) {
		assert(density >= seeded, 'Densities must be in increasing order.');
		while (seeded < density) {
			const count = Math.min(100, density - seeded);
			await convexRun('seed:seedAccommodations', {
				count,
				ownerId,
				denseBelgrade: true,
				offset: seeded
			});
			seeded += count;
		}
		for (const cpuRate of [1, 4]) {
			await command('Emulation.setCPUThrottlingRate', { rate: cpuRate });
			await command('Emulation.setDeviceMetricsOverride', {
				width: cpuRate === 1 ? 1440 : 390,
				height: 900,
				deviceScaleFactor: 1,
				mobile: false
			});
			for (const [guests, bedrooms, narrow] of [
				[0, 0, false],
				[6, 3, false],
				[0, 0, true]
			] as const) {
				const samples = [];
				for (let index = 0; index <= repetitions; index++) {
					const firstLogIndex = executionLogs.length;
					const result = await command('Runtime.evaluate', {
						expression: `window.searchMapBenchmark.run(${guests}, ${bedrooms}, ${narrow})`,
						awaitPromise: true,
						returnByValue: true
					});
					assert(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
					const sample = result.result?.value;
					assert(
						sample && sample !== true && sample.listCount <= 9 && sample.queryCalls > 0,
						'Invalid viewport sample.'
					);
					if (!readOnly && guests === 0 && !narrow) {
						assert(sample.markerCount >= density, 'Browser and seed deployment may not match.');
					}
					if (!readOnly) await delay(1_000); // Let the log stream catch up; excluded from sample timing.
					// Correlate by arrival order: local and deployment clocks can drift.
					// Keep other viewport benchmarks idle while this run is collecting logs.
					const matchingLogs = executionLogs.slice(firstLogIndex);
					const hasAllLogs = matchingLogs.length === sample.queryCalls;
					if (index > 0)
						samples.push({
							...sample,
							rowsRead: hasAllLogs
								? matchingLogs.reduce((sum, log) => sum + log.usageStats.databaseReadDocuments, 0)
								: null,
							serverQueryMs: hasAllLogs
								? matchingLogs.reduce((sum, log) => sum + log.executionTime * 1000, 0)
								: null
						});
				}
				const orderedTimes = samples.map((sample) => sample.viewportUpdateMs).sort((a, b) => a - b);
				const p95 = orderedTimes[Math.ceil(orderedTimes.length * 0.95) - 1];
				const result = {
					density,
					cpuRate,
					guests,
					bedrooms,
					narrow,
					p95ViewportUpdateMs: p95,
					samples
				};
				results.push(result);
				console.log(
					`${density} added listings, CPU ${cpuRate}x, guests ${guests}, rooms ${bedrooms}, narrow ${narrow}: p95 ${Math.round(p95)} ms`
				);
			}
		}
	}
	// Writing inside the workspace triggers Vite reloads, so save after collection.
	await writeFile(
		readOnly ? 'docs/SearchMapBenchmarkBaseline.json' : 'docs/SearchMapBenchmarkResults.json',
		JSON.stringify(
			{
				deployment,
				readOnly,
				recordedAt: new Date().toISOString(),
				repetitions,
				queryExecutions: executionLogs.map((entry) => ({
					finishedAt: entry.timestamp * 1000,
					rowsRead: entry.usageStats.databaseReadDocuments,
					serverQueryMs: entry.executionTime * 1000
				})),
				results
			},
			null,
			2
		) + '\n'
	);
} finally {
	if (socket?.readyState === WebSocket.OPEN) {
		await command('Browser.close').catch(() => {});
	}
	socket?.close();
	edge.kill();
	logs?.kill();
	// Only remove this run's temporary profile, after checking its absolute parent.
	const resolvedProfile = resolve(profile);
	assert(
		dirname(resolvedProfile) === resolve(tmpdir()) &&
			basename(resolvedProfile).startsWith('bg-search-map-')
	);
	if (!readOnly) {
		let removed: number;
		do {
			removed = await convexRun('seed:clearSeededAccommodations', { ownerId });
		} while (removed > 0);
		console.log(`Cleaned benchmark owner ${ownerId}.`);
	}
	await delay(500);
	await rm(resolvedProfile, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
}

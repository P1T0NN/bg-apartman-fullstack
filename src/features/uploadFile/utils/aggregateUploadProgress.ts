// UTILS
import { sumBy } from '../../../shared/lib/algorithms/index.js';

// TYPES
import type { FileUploadProgress } from '../types/uploadFileTypes.js';

export function aggregateUploadProgress(files: FileUploadProgress[]): number {
	const total = sumBy(files, (file) => file.total);
	if (total === 0) return 0;
	const loaded = sumBy(files, (file) => Math.min(file.loaded, file.total));
	return Math.round((loaded / total) * 100);
}

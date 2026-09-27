// DATA
import type { AMENITIES } from '../data/accommodationsData.js';

export type AmenityDefinition = (typeof AMENITIES)[number];
export type AmenityKey = AmenityDefinition['key'];

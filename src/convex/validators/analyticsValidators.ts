// LIBRARIES
import { v } from 'convex/values';

export const analyticsRange = v.object({ from: v.number(), to: v.number() });
export const revenuePoint = v.object({ date: v.number(), revenue: v.number() });

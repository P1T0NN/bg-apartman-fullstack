/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adapter from "../adapter.js";
import type * as generatedSchema from "../generatedSchema.js";
import type * as migrations_removeUserPaypalFields from "../migrations/removeUserPaypalFields.js";
import type * as queries_fetchSessions from "../queries/fetchSessions.js";
import type * as queries_fetchUser from "../queries/fetchUser.js";
import type * as queries_fetchUsers from "../queries/fetchUsers.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import { anyApi, componentsGeneric } from "convex/server";

const fullApi: ApiFromModules<{
  adapter: typeof adapter;
  generatedSchema: typeof generatedSchema;
  "migrations/removeUserPaypalFields": typeof migrations_removeUserPaypalFields;
  "queries/fetchSessions": typeof queries_fetchSessions;
  "queries/fetchUser": typeof queries_fetchUser;
  "queries/fetchUsers": typeof queries_fetchUsers;
}> = anyApi as any;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
> = anyApi as any;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
> = anyApi as any;

export const components = componentsGeneric() as unknown as {};

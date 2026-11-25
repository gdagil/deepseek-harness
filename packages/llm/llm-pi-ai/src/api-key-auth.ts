/**
 * Api-key authentication for a route the harness authenticates itself.
 *
 * @module dsh-llm-pi-ai/api-key-auth
 */

import type { ApiKeyAuth } from '@earendil-works/pi-ai'

/**
 * Api-key auth for a route the harness authenticates itself. `Models` calls
 * this after the adapter has already resolved the route's credential, so a
 * missing key here is not this layer's failure: a named-but-unresolvable
 * reference has already failed the request with `MISSING_CREDENTIAL`, and a
 * route naming no credential at all is deliberately unauthenticated. Reporting
 * it as configured hands the decision to the protocol, which is where the
 * requirement actually lives — pi-ai's OpenAI-compatible implementation, for
 * one, still insists on a key or an `Authorization` header of its own.
 * @param name - display name used as the resolution's status label.
 * @returns the api-key auth for a harness-authenticated route.
 */
export function harnessApiKeyAuth(name: string): ApiKeyAuth {
  return {
    name,
    resolve: ({ credential }) => Promise.resolve({
      auth: credential?.key === undefined ? {} : { apiKey: credential.key },
      source: name,
    }),
  }
}

/**
 * Api-key auth that prefers a supplied credential and falls back to the
 * provider's declared environment variables.
 *
 * A shipped catalog provider has no login flow and no ambient discovery of its
 * own, so this is what keeps "leave the key blank to use the environment"
 * working for it: the settings surface lists the same variables as the route's
 * credential references, and a request with no stored key reads them here.
 * @param name - display name used as the resolution's status label.
 * @param envVars - environment variables to read, in lookup order.
 * @returns the api-key auth for a shipped route.
 */
export function environmentApiKeyAuth(name: string, envVars: readonly string[]): ApiKeyAuth {
  return {
    name,
    resolve: async ({ ctx, credential }) => {
      if (credential?.key !== undefined) return { auth: { apiKey: credential.key }, source: name }
      for (const variable of envVars) {
        const value = await ctx.env(variable)
        if (value !== undefined && value.length > 0) return { auth: { apiKey: value }, source: variable }
      }
      return undefined
    },
  }
}

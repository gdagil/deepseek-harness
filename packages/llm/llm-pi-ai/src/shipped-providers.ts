/**
 * Catalog providers this package ships beside the installed pi-ai catalog.
 *
 * pi-ai's catalog arrives as a dependency, so a provider it does not describe
 * would otherwise be reachable only as a hand-declared route whose endpoint,
 * protocol, and model list every deployment restates. A shipped entry makes
 * such a provider first-class here: the catalog lookups answer for it exactly
 * as for an installed one, so a profile configures it by naming a route key and
 * a credential, and the configuration surfaces offer it with its endpoint and
 * models already known.
 *
 * Cloud.ru Foundation Models is the first entry. Its models are generated from
 * the service's public listing (`scripts/gen-cloudru-models.ts`), and every
 * shipped model names the wire protocol the service serves it on. One route
 * therefore covers two endpoints: a model's own `baseUrl` decides where its
 * request goes, which is why a route-level `baseURL` must match the protocol
 * it names or be left unset.
 *
 * @module dsh-llm-pi-ai/shipped-providers
 */

import type { Provider } from '@earendil-works/pi-ai'
import { anthropicMessagesApi } from '@earendil-works/pi-ai/api/anthropic-messages.lazy'
import { openAICompletionsApi } from '@earendil-works/pi-ai/api/openai-completions.lazy'
import { environmentApiKeyAuth } from './api-key-auth.ts'
import { CLOUDRU_COMPLETIONS_BASE_URL, CLOUDRU_MODELS } from './cloudru-models.generated.ts'
import { createProvider } from './pi-provider.ts'

/** One catalog provider this package contributes. */
export interface ShippedProvider {
  /** The pi-ai provider the catalog lookups answer with. */
  provider: Provider
  /** Credential references the provider's own auth reads, in lookup order. */
  env: readonly string[]
}

/**
 * The Cloud.ru Foundation Models route: one provider over the service's two
 * wire protocols, authenticated by the account's API key.
 * @returns the shipped entry.
 */
function cloudru(): ShippedProvider {
  const env = ['CLOUDRU_API_KEY'] as const
  return {
    env,
    provider: createProvider({
      id: 'cloudru',
      name: 'Cloud.ru Foundation Models',
      // Display endpoint, and the fallback for a shipped model that named no
      // `baseUrl` of its own. The Messages models keep the API root instead.
      baseUrl: CLOUDRU_COMPLETIONS_BASE_URL,
      auth: { apiKey: environmentApiKeyAuth('Cloud.ru API key', env) },
      models: CLOUDRU_MODELS,
      api: {
        'openai-completions': openAICompletionsApi(),
        'anthropic-messages': anthropicMessagesApi(),
      },
    }),
  }
}

/** Every shipped provider, by route id, after the installed catalog's own. */
export const SHIPPED_PROVIDERS: ReadonlyMap<string, ShippedProvider> = new Map([['cloudru', cloudru()]])

/**
 * pi-ai provider and collection construction from public narrow entry points.
 *
 * This module exists apart from {@link module:dsh-llm-pi-ai/models} because it
 * imports nothing from the catalog: both the catalog lookups and the provider
 * a shipped catalog entry contributes build through it, so it cannot depend on
 * the module that consumes them.
 *
 * @module dsh-llm-pi-ai/pi-provider
 */

import { builtinModels } from '@earendil-works/pi-ai/providers/all'
import type {
  Api,
  CreateModelsOptions,
  Model,
  MutableModels,
  Provider,
  ProviderAuth,
  ProviderStreams,
} from '@earendil-works/pi-ai'

/** Protocol implementations keyed by the {@link Model.api} value that selects one. */
export type ProtocolTable = Readonly<Record<string, ProviderStreams>>

/** Input accepted by the static providers this package builds. */
export interface StaticProviderOptions {
  /** Provider route key and each model's `provider`. */
  id: string
  /** Display name for selectors and status labels. */
  name: string
  /** Provider-level endpoint, used for display and as a catalog fallback. */
  baseUrl?: string
  /** Authentication the provider's own routes resolve. */
  auth: ProviderAuth
  /** Models this provider serves. */
  models: readonly Model<Api>[]
  /**
   * One protocol implementation for every model, or a table keyed by protocol
   * for a provider whose models are served on more than one.
   */
  api: ProviderStreams | ProtocolTable
}

/**
 * Create an empty pi-ai collection without importing its aggregate entry point.
 * @param options - credential storage and ambient authentication integrations.
 * @returns a mutable collection with no registered providers.
 */
export function createModels(options?: CreateModelsOptions): MutableModels {
  const models = builtinModels(options)
  models.clearProviders()
  return models
}

/**
 * The protocol implementation one model dispatches to.
 * @param api - the single implementation, or the table keyed by protocol.
 * @param model - the model whose request is being dispatched.
 * @returns the implementation serving the model's protocol.
 * @throws Error when a table names no implementation for the model's protocol.
 */
function protocolFor(api: ProviderStreams | ProtocolTable, model: Model<Api>): ProviderStreams {
  if (typeof (api as ProviderStreams).stream === 'function') return api as ProviderStreams
  const streams = (api as ProtocolTable)[model.api]
  if (streams === undefined) {
    throw new Error(`provider "${model.provider}" has no protocol implementation for "${model.api}"`)
  }
  return streams
}

/**
 * Create a static provider over the supplied models and protocol
 * implementation(s). A protocol table dispatches per model, which is what lets
 * one route carry models served on two endpoints.
 * @param input - provider identity, models, authentication, and protocol implementation(s).
 * @returns a provider that delegates each operation to the model's protocol.
 */
export function createProvider(input: StaticProviderOptions): Provider {
  const api = input.api
  return {
    id: input.id,
    name: input.name,
    ...input.baseUrl === undefined ? {} : { baseUrl: input.baseUrl },
    auth: input.auth,
    getModels: () => input.models,
    stream: (model, context, options) => protocolFor(api, model).stream(model, context, options),
    streamSimple: (model, context, options) => protocolFor(api, model).streamSimple(model, context, options),
  }
}

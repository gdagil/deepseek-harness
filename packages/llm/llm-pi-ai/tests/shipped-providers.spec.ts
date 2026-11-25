import { describe, expect, it } from 'vitest'
import type {
  Api,
  AssistantMessageEventStream,
  AuthContext,
  Model,
  Provider,
  ProviderStreams,
} from '@earendil-works/pi-ai'
import { createAssistantMessageEventStream } from '@earendil-works/pi-ai/utils/event-stream'
import { normalizeContext } from '@earendil-works/pi-ai/utils/transcript'
import {
  catalogModels,
  catalogProvider,
  catalogProviderIds,
  resolveRouteModels,
} from '../src/catalog.ts'
import {
  CLOUDRU_COMPLETIONS_BASE_URL,
  CLOUDRU_MESSAGES_BASE_URL,
} from '../src/cloudru-models.generated.ts'
import { createProvider } from '../src/pi-provider.ts'
import { providerDefaultsOf } from '../src/provider-data.ts'
import { SHIPPED_PROVIDERS } from '../src/shipped-providers.ts'
import type { ShippedProvider } from '../src/shipped-providers.ts'

/**
 * One shipped entry, narrowed for the cases below.
 * @param id - route id the package ships.
 * @returns the shipped entry.
 */
function shipped(id: string): ShippedProvider {
  const entry = SHIPPED_PROVIDERS.get(id)
  if (entry === undefined) throw new Error(`${id} is not shipped`)
  return entry
}

/** The entry under test. */
const cloudru = shipped('cloudru')

/** A stand-in protocol implementation that reports which protocol dispatched. */
function recorder(seen: string[]): ProviderStreams {
  const record = (model: Model<Api>): AssistantMessageEventStream => {
    seen.push(model.api)
    return createAssistantMessageEventStream()
  }
  return { stream: record, streamSimple: record }
}

/** A model naming one protocol, sized minimally for dispatch. */
function model(id: string, api: Api): Model<Api> {
  return {
    id,
    name: id,
    api,
    provider: 'dispatch-fixture',
    baseUrl: 'https://fixture.invalid',
    input: ['text'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    reasoning: false,
    contextWindow: 1024,
    maxTokens: 256,
  }
}

/** An authentication context that reads no environment and no file. */
const authContext: AuthContext = {
  env: () => Promise.resolve(undefined),
  fileExists: () => Promise.resolve(false),
}

/**
 * A provider carrying the shipped id and an endpoint under test.
 * @param baseUrl - provider-level endpoint to report.
 * @returns a complete provider whose only interesting field is the endpoint.
 */
function providerWith(baseUrl: string | undefined): Provider {
  const provider = createProvider({
    id: 'cloudru',
    name: 'Cloud.ru Foundation Models',
    auth: { apiKey: { name: 'Cloud.ru API key', resolve: () => Promise.resolve(undefined) } },
    models: [],
    api: recorder([]),
  })
  return baseUrl === undefined ? provider : { ...provider, baseUrl }
}

describe('shipped cloud.ru provider', () => {
  it('ships one provider authenticated by the Cloud.ru key variable', () => {
    expect([...SHIPPED_PROVIDERS.keys()]).toEqual(['cloudru'])
    expect(cloudru.env).toEqual(['CLOUDRU_API_KEY'])
    expect(cloudru.provider.id).toBe('cloudru')
    expect(cloudru.provider.name).toBe('Cloud.ru Foundation Models')
    expect(cloudru.provider.baseUrl).toBe(CLOUDRU_COMPLETIONS_BASE_URL)
  })

  it('prefers a stored key, then the declared environment variable', async () => {
    const auth = cloudru.provider.auth.apiKey
    if (auth === undefined) throw new Error('cloudru ships no api-key auth')
    const signal = new AbortController().signal
    const withEnv: AuthContext = {
      ...authContext,
      env: name => Promise.resolve(name === 'CLOUDRU_API_KEY' ? 'env-key' : undefined),
    }

    await expect(auth.resolve({
      ctx: withEnv,
      credential: { type: 'api_key', key: 'stored-key' },
      signal,
    })).resolves.toEqual({ auth: { apiKey: 'stored-key' }, source: 'Cloud.ru API key' })

    await expect(auth.resolve({ ctx: withEnv, signal }))
      .resolves.toEqual({ auth: { apiKey: 'env-key' }, source: 'CLOUDRU_API_KEY' })

    // Neither source configured: pi-ai reports the route as unconfigured.
    await expect(auth.resolve({ ctx: authContext, signal })).resolves.toBeUndefined()
  })

  it('joins the catalog after the installed providers, with its own models', () => {
    const ids = catalogProviderIds()
    expect(ids.at(-1)).toBe('cloudru')
    expect(catalogProvider('cloudru')).toBe(cloudru.provider)

    const models = catalogModels('cloudru')
    expect(models.size).toBe(cloudru.provider.getModels().length)
    for (const [id, entry] of models) expect(entry.id).toBe(id)
  })

  it('reports the endpoint and credential reference configuration surfaces show', () => {
    expect(providerDefaultsOf(cloudru.provider)).toEqual({
      defaultBaseURL: CLOUDRU_COMPLETIONS_BASE_URL,
      nativeAuth: { env: ['CLOUDRU_API_KEY'], oauth: false },
    })
  })

  it('reports no endpoint for a shipped entry whose endpoint is unknown or templated', () => {
    const nativeAuth = { env: ['CLOUDRU_API_KEY'], oauth: false }
    expect(providerDefaultsOf(providerWith(undefined))).toEqual({ nativeAuth })
    expect(providerDefaultsOf(providerWith('https://{REGION}.example/v1'))).toEqual({ nativeAuth })
  })

  it('materializes the whole shipped catalog for a route that configures nothing', () => {
    const resolved = resolveRouteModels({
      provider: 'cloudru',
      defaultInput: ['text'],
      defaultContextWindow: 1_000_000,
      defaultMaxTokens: 128_000,
    })

    expect(resolved.models.length).toBe(cloudru.provider.getModels().length)
    const messages = resolved.models.filter(entry => entry.api === 'anthropic-messages')
    const completions = resolved.models.filter(entry => entry.api === 'openai-completions')
    expect(messages.length).toBeGreaterThan(0)
    expect(completions.length).toBeGreaterThan(0)
    // Each protocol reaches the endpoint its own client appends its path to.
    for (const entry of messages) expect(entry.baseUrl).toBe(CLOUDRU_MESSAGES_BASE_URL)
    for (const entry of completions) expect(entry.baseUrl).toBe(CLOUDRU_COMPLETIONS_BASE_URL)
  })
})

describe('createProvider protocol dispatch', () => {
  it('sends each model to the protocol its own api names', () => {
    const seen: string[] = []
    const provider = createProvider({
      id: 'dispatch-fixture',
      name: 'Dispatch fixture',
      auth: { apiKey: { name: 'key', resolve: () => Promise.resolve({ auth: {} }) } },
      models: [model('completions-model', 'openai-completions'), model('messages-model', 'anthropic-messages')],
      api: { 'openai-completions': recorder(seen), 'anthropic-messages': recorder(seen) },
    })
    const context = normalizeContext({ messages: [] })

    for (const entry of provider.getModels()) provider.stream(entry, context)
    for (const entry of provider.getModels()) provider.streamSimple(entry, context)

    expect(seen).toEqual([
      'openai-completions', 'anthropic-messages',
      'openai-completions', 'anthropic-messages',
    ])
  })

  it('refuses a table that names no protocol for the model', () => {
    const seen: string[] = []
    const provider = createProvider({
      id: 'dispatch-fixture',
      name: 'Dispatch fixture',
      auth: { apiKey: { name: 'key', resolve: () => Promise.resolve({ auth: {} }) } },
      models: [model('messages-model', 'anthropic-messages')],
      api: { 'openai-completions': recorder(seen) },
    })
    const [only] = provider.getModels()
    if (only === undefined) throw new Error('fixture ships no model')
    const context = normalizeContext({ messages: [] })

    expect(() => provider.stream(only, context)).toThrow('has no protocol implementation for "anthropic-messages"')
    expect(() => provider.streamSimple(only, context)).toThrow('has no protocol implementation for "anthropic-messages"')
  })
})

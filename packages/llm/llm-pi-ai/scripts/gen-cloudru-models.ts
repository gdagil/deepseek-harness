/**
 * Generate the shipped Cloud.ru Foundation Models catalog.
 *
 * Cloud.ru publishes its chat models over a public listing endpoint that needs
 * no credentials, so the snapshot DSH ships is derived from the service's own
 * answer instead of being transcribed by hand. The listing discloses the
 * context window, the input modalities, and — per model — which wire protocols
 * the service serves it on; everything else a pi-ai model needs is a DSH
 * decision, stated once below.
 *
 * Run `pnpm gen-cloudru-models` after changing the mapping or refreshing the
 * snapshot. The generator needs network access; nothing at runtime does.
 */

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/** Public listing of the provider's chat models; requires no credential. */
const LISTING_URL = 'https://foundation-models.api.cloud.ru/v1/models'

/** Endpoint the OpenAI Chat Completions protocol appends `/chat/completions` to. */
const COMPLETIONS_BASE_URL = 'https://foundation-models.api.cloud.ru/v1'

/** Endpoint the Anthropic Messages protocol appends `/v1/messages` to. */
const MESSAGES_BASE_URL = 'https://foundation-models.api.cloud.ru'

/**
 * Output ceiling asserted for every model: the listing discloses no output cap.
 * The value is a conservative capability, and for Anthropic Messages models it
 * is also the `max_tokens` every request must carry, so it stays below the
 * smallest advertised output ceiling of the served models.
 */
const MAX_TOKENS = 32_768

/** One entry of the listing endpoint, as far as this generator reads it. */
interface ListingModel {
  id: string
  context_length?: number
  max_model_len?: number
  metadata?: {
    type?: string
    name?: string
    input_modalities?: readonly string[]
    endpoints?: readonly { path?: string }[]
  }
}

const response = await fetch(LISTING_URL)
if (!response.ok) throw new Error(`GET ${LISTING_URL} -> ${response.status}`)
const listing = await response.json() as { data?: readonly ListingModel[] }
if (!Array.isArray(listing.data)) throw new Error('listing carries no data array')

/**
 * The endpoints one listing entry is served on.
 * @param model - one listing entry.
 * @returns the paths the service publishes for it.
 */
function endpointsOf(model: ListingModel): ReadonlySet<string> {
  return new Set((model.metadata?.endpoints ?? []).map(endpoint => endpoint.path ?? ''))
}

/**
 * The pi-ai protocol one entry speaks: the native Anthropic protocol where the
 * service offers it — it carries thinking signatures and prompt-cache markers a
 * Chat Completions shim flattens — and Chat Completions everywhere else.
 * @param model - one listing entry.
 * @returns the protocol id, which also selects the endpoint.
 */
function protocolOf(model: ListingModel): 'anthropic-messages' | 'openai-completions' {
  return endpointsOf(model).has('/v1/messages') ? 'anthropic-messages' : 'openai-completions'
}

/**
 * Request modalities in DSH's vocabulary, which is only text and image.
 * @param model - one listing entry.
 * @returns the modalities to declare.
 */
function inputOf(model: ListingModel): readonly ('text' | 'image')[] {
  const declared = model.metadata?.input_modalities ?? []
  return declared.includes('image') ? ['text', 'image'] : ['text']
}

/**
 * The context window the listing discloses.
 * @param model - one listing entry.
 * @returns a positive token count.
 */
function contextOf(model: ListingModel): number {
  const context = model.context_length ?? model.max_model_len
  if (context === undefined || !Number.isInteger(context) || context <= 0) {
    throw new Error(`${model.id}: listing carries no positive context length`)
  }
  return context
}

const models = listing.data
  .filter((model): model is ListingModel => typeof model.id === 'string' && model.id.length > 0)
  .filter(model => model.metadata?.type === 'llm')
  .sort((left, right) => left.id.localeCompare(right.id))

if (models.length === 0) throw new Error('listing carries no llm model')

/** One single-quoted TypeScript literal, matching the package's own source style. */
const quote = (value: string): string => `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`
const literals = models.map((model) => {
  const protocol = protocolOf(model)
  const context = contextOf(model)
  const input = inputOf(model)
  return `  chat(${[
    quote(model.id),
    quote(model.metadata?.name ?? model.id),
    quote(protocol),
    context,
    `[${input.map(quote).join(', ')}]`,
  ].join(', ')}),\n`
}).join('')

const source = `/** Generated from ${LISTING_URL}. Run pnpm gen-cloudru-models; do not edit. */

import type { Api, Model } from '@earendil-works/pi-ai'

/** Endpoint the OpenAI Chat Completions protocol appends \`/chat/completions\` to. */
export const CLOUDRU_COMPLETIONS_BASE_URL = ${quote(COMPLETIONS_BASE_URL)}

/** Endpoint the Anthropic Messages protocol appends \`/v1/messages\` to. */
export const CLOUDRU_MESSAGES_BASE_URL = ${quote(MESSAGES_BASE_URL)}

/** Pricing is not reported by the harness, so every shipped entry carries none. */
const NO_COST = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }

/**
 * Output ceiling asserted for every model: the listing discloses no output cap,
 * and an Anthropic Messages model needs one on every request.
 */
const MAX_TOKENS = ${MAX_TOKENS}

/**
 * One shipped chat entry.
 * @param id - model id the service accepts in a request.
 * @param name - display name from the listing.
 * @param api - protocol the service serves this model on.
 * @param contextWindow - combined request and response capacity.
 * @param input - request modalities the listing declares.
 * @returns the pi-ai catalog entry.
 */
function chat(
  id: string,
  name: string,
  api: Api,
  contextWindow: number,
  input: ('text' | 'image')[],
): Model<Api> {
  return {
    id,
    name,
    api,
    provider: 'cloudru',
    baseUrl: api === 'anthropic-messages' ? CLOUDRU_MESSAGES_BASE_URL : CLOUDRU_COMPLETIONS_BASE_URL,
    input,
    cost: NO_COST,
    // Reasoning stays undeclared: the listing publishes no thinking protocol,
    // and a model that thinks anyway still reports its reasoning blocks. A
    // deployment that wants selectable effort declares it per model under
    // \`modelOverrides\` with \`reasoningEfforts\`.
    reasoning: false,
    contextWindow,
    maxTokens: MAX_TOKENS,
  }
}

/**
 * Chat models the service publishes, in id order.
 *
 * Every model the listing calls \`llm\` is here, including the ones Cloud.ru
 * proxies to an external vendor: which of those an organization may call is an
 * account-level RBAC decision the listing does not report, so the catalog lists
 * them all rather than guessing an account's access.
 */
export const CLOUDRU_MODELS: readonly Model<Api>[] = [
${literals}]
`

const path = fileURLToPath(new URL('../src/cloudru-models.generated.ts', import.meta.url))
writeFileSync(path, source)
const messages = models.filter(model => protocolOf(model) === 'anthropic-messages').length
console.log(`wrote ${models.length} models (${messages} anthropic-messages, ${models.length - messages} openai-completions) to ${path}`)

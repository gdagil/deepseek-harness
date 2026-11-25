/** Generated from https://foundation-models.api.cloud.ru/v1/models. Run pnpm gen-cloudru-models; do not edit. */

import type { Api, Model } from '@earendil-works/pi-ai'

/** Endpoint the OpenAI Chat Completions protocol appends `/chat/completions` to. */
export const CLOUDRU_COMPLETIONS_BASE_URL = 'https://foundation-models.api.cloud.ru/v1'

/** Endpoint the Anthropic Messages protocol appends `/v1/messages` to. */
export const CLOUDRU_MESSAGES_BASE_URL = 'https://foundation-models.api.cloud.ru'

/** Pricing is not reported by the harness, so every shipped entry carries none. */
const NO_COST = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }

/**
 * Output ceiling asserted for every model: the listing discloses no output cap,
 * and an Anthropic Messages model needs one on every request.
 */
const MAX_TOKENS = 32768

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
    // `modelOverrides` with `reasoningEfforts`.
    reasoning: false,
    contextWindow,
    maxTokens: MAX_TOKENS,
  }
}

/**
 * Chat models the service publishes, in id order.
 *
 * Every model the listing calls `llm` is here, including the ones Cloud.ru
 * proxies to an external vendor: which of those an organization may call is an
 * account-level RBAC decision the listing does not report, so the catalog lists
 * them all rather than guessing an account's access.
 */
export const CLOUDRU_MODELS: readonly Model<Api>[] = [
  chat('ai-sage/GigaChat3-10B-A1.8B', 'GigaChat3-10B-A1.8B', 'openai-completions', 262144, ['text']),
  chat('ai-sage/GigaChat3.5-432B-A28B', 'GigaChat3.5-432B-A28B', 'openai-completions', 262144, ['text']),
  chat('anthropic/claude-fable-5', 'Claude Fable 5', 'anthropic-messages', 1000000, ['text', 'image']),
  chat('anthropic/claude-fable-5.1', 'Claude Fable 5.1', 'anthropic-messages', 1000000, ['text', 'image']),
  chat('anthropic/claude-haiku-4.5', 'Claude Haiku 4.5', 'anthropic-messages', 200000, ['text', 'image']),
  chat('anthropic/claude-opus-4.5', 'Claude Opus 4.5', 'anthropic-messages', 200000, ['text', 'image']),
  chat('anthropic/claude-opus-4.6', 'Claude Opus 4.6', 'anthropic-messages', 1000000, ['text', 'image']),
  chat('anthropic/claude-opus-4.7', 'Claude Opus 4.7', 'anthropic-messages', 1000000, ['text', 'image']),
  chat('anthropic/claude-opus-4.8', 'Claude Opus 4.8', 'anthropic-messages', 1000000, ['text', 'image']),
  chat('anthropic/claude-opus-5', 'Claude Opus 5', 'anthropic-messages', 1000000, ['text', 'image']),
  chat('anthropic/claude-opus-5.5', 'Claude Opus 5.5', 'anthropic-messages', 1000000, ['text', 'image']),
  chat('anthropic/claude-sonnet-4.5', 'Claude Sonnet 4.5', 'anthropic-messages', 1000000, ['text', 'image']),
  chat('anthropic/claude-sonnet-4.6', 'Claude Sonnet 4.6', 'anthropic-messages', 1000000, ['text', 'image']),
  chat('anthropic/claude-sonnet-5', 'Claude Sonnet 5', 'anthropic-messages', 1000000, ['text', 'image']),
  chat('anthropic/claude-sonnet-5.5', 'Claude Sonnet 5.5', 'anthropic-messages', 1000000, ['text', 'image']),
  chat('deepseek-ai/DeepSeek-V4-Flash', 'DeepSeek-V4-Flash', 'openai-completions', 1048576, ['text']),
  chat('deepseek-ai/DeepSeek-V4-Pro', 'DeepSeek-V4-Pro', 'openai-completions', 1048576, ['text']),
  chat('deepseek-ai/DeepSeek-V4.1-Flash', 'DeepSeek-V4.1-Flash', 'openai-completions', 1048576, ['text']),
  chat('deepseek-ai/DeepSeek-V4.1-Flash-1017', 'DeepSeek-V4.1-Flash-1017', 'openai-completions', 1048576, ['text']),
  chat('GigaChat/GigaChat-3-Pro', 'GigaChat-3-Pro', 'openai-completions', 262144, ['text']),
  chat('google/gemini-2.5-flash', 'Gemini 2.5 Flash', 'openai-completions', 1048576, ['text', 'image']),
  chat('google/gemini-2.5-flash-image', 'Gemini 2.5 Flash Image', 'openai-completions', 32768, ['text', 'image']),
  chat('google/gemini-2.5-pro', 'Gemini 2.5 Pro', 'openai-completions', 1048576, ['text', 'image']),
  chat('google/gemini-3-flash-preview', 'Gemini 3 Flash Preview', 'openai-completions', 1048576, ['text', 'image']),
  chat('google/gemini-3-pro-image-preview', 'Gemini 3 Pro Image Preview', 'openai-completions', 65536, ['text', 'image']),
  chat('google/gemini-3.1-flash-image-preview', 'Gemini 3.1 Flash Image Preview', 'openai-completions', 65536, ['text', 'image']),
  chat('google/gemini-3.1-flash-lite', 'Gemini 3.1 Flash Lite', 'openai-completions', 1048576, ['text', 'image']),
  chat('google/gemini-3.1-flash-lite-image', 'Gemini 3.1 Flash Lite Image', 'openai-completions', 65536, ['text', 'image']),
  chat('google/gemini-3.1-pro-preview', 'Gemini 3.1 Pro Preview', 'openai-completions', 1048576, ['text', 'image']),
  chat('google/gemini-3.5-flash', 'Gemini 3.5 Flash', 'openai-completions', 1048576, ['text', 'image']),
  chat('google/gemini-3.5-flash-lite', 'Gemini 3.5 Flash Lite', 'openai-completions', 1048576, ['text', 'image']),
  chat('google/gemini-3.6-flash', 'Gemini 3.6 Flash', 'openai-completions', 1048576, ['text', 'image']),
  chat('google/gemini-3.7-flash', 'Gemini 3.7 Flash', 'openai-completions', 1048576, ['text', 'image']),
  chat('google/gemini-3.8-flash', 'Gemini 3.8 Flash', 'openai-completions', 1048576, ['text', 'image']),
  chat('meta-llama/llama-3.3-70b-instruct', 'llama-3.3-70b-instruct', 'openai-completions', 131072, ['text']),
  chat('MiniMaxAI/MiniMax-M3', 'MiniMax-M3', 'openai-completions', 524288, ['text', 'image']),
  chat('moonshotai/Kimi-K2.6', 'Kimi-K2.6', 'openai-completions', 262144, ['text', 'image']),
  chat('moonshotai/kimi-k2.7-code', 'kimi-k2.7-code', 'openai-completions', 262144, ['text', 'image']),
  chat('moonshotai/kimi-k3', 'kimi-k3', 'openai-completions', 1048576, ['text', 'image']),
  chat('openai/chatgpt-4o-latest', 'ChatGPT 4o Latest', 'openai-completions', 128000, ['text']),
  chat('openai/gpt-4.1', 'GPT 4.1', 'openai-completions', 1047576, ['text', 'image']),
  chat('openai/gpt-4.1-mini', 'GPT 4.1 Mini', 'openai-completions', 1047576, ['text', 'image']),
  chat('openai/gpt-4o-mini', 'GPT 4o Mini', 'openai-completions', 128000, ['text', 'image']),
  chat('openai/gpt-5', 'GPT 5', 'openai-completions', 400000, ['text', 'image']),
  chat('openai/gpt-5-mini', 'GPT 5 Mini', 'openai-completions', 400000, ['text', 'image']),
  chat('openai/gpt-5-nano', 'GPT 5 Nano', 'openai-completions', 400000, ['text', 'image']),
  chat('openai/gpt-5.1', 'GPT 5.1', 'openai-completions', 400000, ['text', 'image']),
  chat('openai/gpt-5.2', 'GPT 5.2', 'openai-completions', 400000, ['text', 'image']),
  chat('openai/gpt-5.3-codex', 'GPT 5.3 Codex', 'openai-completions', 400000, ['text', 'image']),
  chat('openai/gpt-5.4', 'GPT 5.4', 'openai-completions', 1050000, ['text', 'image']),
  chat('openai/gpt-5.4-mini', 'GPT 5.4 Mini', 'openai-completions', 400000, ['text', 'image']),
  chat('openai/gpt-5.4-nano', 'GPT 5.4 Nano', 'openai-completions', 400000, ['text', 'image']),
  chat('openai/gpt-5.4-pro', 'GPT 5.4 Pro', 'openai-completions', 1050000, ['text', 'image']),
  chat('openai/gpt-5.5', 'GPT 5.5', 'openai-completions', 1050000, ['text', 'image']),
  chat('openai/gpt-5.5-pro', 'GPT 5.5 Pro', 'openai-completions', 1050000, ['text', 'image']),
  chat('openai/gpt-5.6-luna', 'GPT 5.6 Luna', 'openai-completions', 1050000, ['text', 'image']),
  chat('openai/gpt-5.6-sol', 'GPT 5.6 Sol', 'openai-completions', 1050000, ['text', 'image']),
  chat('openai/gpt-5.6-terra', 'GPT 5.6 Terra', 'openai-completions', 1050000, ['text', 'image']),
  chat('openai/gpt-6-astra', 'GPT 6 Astra', 'openai-completions', 1050000, ['text', 'image']),
  chat('openai/gpt-6-luna', 'GPT 6 Luna', 'openai-completions', 1050000, ['text', 'image']),
  chat('openai/gpt-6-sol', 'GPT 6 Sol', 'openai-completions', 1050000, ['text', 'image']),
  chat('openai/gpt-6.1-sol', 'GPT 6.1 Sol', 'openai-completions', 1050000, ['text', 'image']),
  chat('openai/gpt-chat-latest', 'GPT Chat Latest', 'openai-completions', 400000, ['text', 'image']),
  chat('openai/gpt-oss-120b', 'gpt-oss-120b', 'anthropic-messages', 131072, ['text']),
  chat('openai/gpt-oss-20b', 'GPT OSS 20B', 'openai-completions', 131072, ['text']),
  chat('Qwen/Qwen3-30B-A3B', 'Qwen3-30B-A3B', 'openai-completions', 40960, ['text']),
  chat('Qwen/Qwen3-32B', 'Qwen3-32B', 'openai-completions', 40960, ['text']),
  chat('Qwen/Qwen3-Coder-Next', 'Qwen3-Coder-Next', 'openai-completions', 262144, ['text']),
  chat('Qwen/Qwen3.5-397B-A17B', 'Qwen3.5-397B-A17B', 'openai-completions', 262144, ['text', 'image']),
  chat('qwen/qwen3.6-27b', 'Qwen3.6 27B', 'openai-completions', 262144, ['text', 'image']),
  chat('Qwen/Qwen3.6-35B-A3B', 'Qwen3.6-35B-A3B', 'openai-completions', 262144, ['text', 'image']),
  chat('qwen/qwen3.6-flash', 'Qwen3.6 Flash', 'openai-completions', 1000000, ['text', 'image']),
  chat('qwen/qwen3.6-plus', 'Qwen3.6 Plus', 'openai-completions', 1000000, ['text', 'image']),
  chat('qwen/qwen3.7-flash', 'Qwen3.7 Flash', 'openai-completions', 1000000, ['text', 'image']),
  chat('qwen/qwen3.7-max', 'Qwen3.7 Max', 'openai-completions', 1000000, ['text']),
  chat('qwen/qwen3.7-plus', 'Qwen3.7 Plus', 'openai-completions', 1000000, ['text', 'image']),
  chat('qwen/qwen3.8-2.4t-a95b', 'Qwen3.8 2.4T A95B', 'openai-completions', 1048576, ['text']),
  chat('qwen/qwen3.8-27b', 'Qwen3.8 27B', 'openai-completions', 1000000, ['text', 'image']),
  chat('qwen/qwen3.8-flash', 'Qwen3.8 Flash', 'openai-completions', 1000000, ['text', 'image']),
  chat('qwen/qwen3.8-max', 'Qwen3.8 Max', 'openai-completions', 1000000, ['text', 'image']),
  chat('qwen/qwen3.8-omni-flash', 'Qwen3.8 Omni Flash', 'openai-completions', 1000000, ['text', 'image']),
  chat('xiaomi/mimo-v2.6-flash', 'MiMo-V2.6-Flash', 'openai-completions', 1050000, ['text', 'image']),
  chat('xiaomi/mimo-v2.6-pro', 'MiMo-V2.6-Pro', 'openai-completions', 1050000, ['text', 'image']),
  chat('xiaomi/mimo-v2.6-pro-ultraspeed', 'MiMo-V2.6-Pro-UltraSpeed', 'openai-completions', 1048576, ['text', 'image']),
  chat('z-ai/glm-4.5-air', 'GLM-4.5-Air', 'openai-completions', 131072, ['text']),
  chat('z-ai/glm-4.6', 'GLM-4.6', 'openai-completions', 204800, ['text']),
  chat('z-ai/glm-4.6v', 'GLM-4.6V', 'openai-completions', 131072, ['text', 'image']),
  chat('z-ai/glm-4.7-flash', 'GLM-4.7-Flash', 'openai-completions', 200000, ['text']),
  chat('z-ai/glm-5', 'GLM-5', 'openai-completions', 202752, ['text']),
  chat('z-ai/glm-5.3-flash', 'GLM-5.3-Flash', 'openai-completions', 1048576, ['text', 'image']),
  chat('z-ai/glm-5.3-flashx', 'GLM-5.3-FlashX', 'openai-completions', 1048576, ['text', 'image']),
  chat('z-ai/glm-5v-turbo', 'GLM-5V-Turbo', 'openai-completions', 202752, ['text', 'image']),
  chat('zai-org/GLM-5.1', 'GLM-5.1', 'openai-completions', 1048576, ['text']),
  chat('zai-org/GLM-5.2', 'GLM-5.2', 'openai-completions', 1048576, ['text']),
  chat('zai-org/GLM-5.3', 'GLM-5.3', 'openai-completions', 1048576, ['text']),
]

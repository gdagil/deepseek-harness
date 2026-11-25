/** Provider defaults for configuration surfaces: generated from the installed
 * pi-ai catalog, and stated by each shipped entry.
 *
 * @module dsh-llm-pi-ai/provider-data
 */

import type { Provider } from '@earendil-works/pi-ai'
import type { LlmConfigurableProvider } from '@deepseek-ai/dsh-llm'
import { PROVIDER_DATA } from './provider-data.generated.ts'
import { SHIPPED_PROVIDERS } from './shipped-providers.ts'

/**
 * The fixed public endpoint a provider reports, when it has one that needs no
 * deployment-supplied variable.
 * @param baseUrl - the provider's catalog endpoint.
 * @returns the endpoint metadata, or nothing when the endpoint is unknown or templated.
 */
function fixedEndpoint(baseUrl: string | undefined): Pick<LlmConfigurableProvider, 'defaultBaseURL'> {
  if (baseUrl === undefined || baseUrl.includes('{')) return {}
  return { defaultBaseURL: baseUrl }
}

/**
 * Return generated display metadata without executing authentication.
 * @param provider - Installed catalog provider, possibly from a newer consumer dependency.
 * @returns Known metadata, or only a fixed public endpoint for an unrecorded provider.
 */
export function providerDefaultsOf(provider: Provider): Pick<LlmConfigurableProvider, 'nativeAuth' | 'defaultBaseURL' | 'baseURLEnv'> {
  const shipped = SHIPPED_PROVIDERS.get(provider.id)
  // A shipped entry states its own credential references; the generated table
  // describes only what pi-ai ships.
  if (shipped !== undefined) {
    return {
      ...fixedEndpoint(provider.baseUrl),
      nativeAuth: { env: shipped.env, oauth: false },
    }
  }
  const data = PROVIDER_DATA[provider.id]
  // A consumer can install a newer pi-ai within the dependency range. An
  // unrecorded provider remains configurable without guessed auth metadata.
  if (data === undefined) return fixedEndpoint(provider.baseUrl)
  const { env, ...endpoint } = data
  return { ...endpoint, nativeAuth: { env, oauth: provider.auth.oauth !== undefined } }
}

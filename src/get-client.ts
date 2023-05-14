/**
 * Internal module for starting a Tier API sidecar on demand.
 *
 * This should not be used directly.
 *
 * @internal
 * @module
 */

// TODO: use the built-in tier binary for the appropriate platform
// can do the platform-specific optional dep trick.

// get a client on-demand for servicing the top-level methods.
//
// This spawns a sidecar on localhost as needed, if baseURL is not set.

import type { ChildProcess } from 'child_process'
import { Tier, TierGetClientOptions } from './client.js'

// just use node-fetch as a polyfill for old node environments
let FETCH = globalThis.fetch

// fill-in for browser bundlers
/* c8 ignore start */
const PROCESS =
  typeof process === 'undefined'
    ? {
        pid: 1,
        env: {
          TIER_DEBUG: '',
          NODE_DEBUG: '',
          TIER_API_KEY: '',
          TIER_BASE_URL: '',
          TIER_LIVE: '',
          STRIPE_DEBUG: '',
        },
        on: () => {},
        removeListener: () => {},
        kill: () => {},
      }
    : process
/* c8 ignore start */

let sidecarPID: number | undefined

const debug =
  PROCESS.env.TIER_DEBUG === '1' ||
  /\btier\b/i.test(PROCESS.env.NODE_DEBUG || '')

export const getClient = async (
  clientOptions: TierGetClientOptions = {}
): Promise<Tier> => {
  const { TIER_BASE_URL, TIER_API_KEY } = PROCESS.env
  let { baseURL = TIER_BASE_URL, apiKey = TIER_API_KEY } = clientOptions
  baseURL = baseURL || (apiKey ? 'https://api.tier.run' : undefined)
  if (!baseURL) {
    throw new Error('need to set TIER_API_KEY')
  }

  return new Tier({
    debug,
    fetchImpl: FETCH,
    ...clientOptions,
    baseURL,
    apiKey,
  })
}

// evade clever bundlers that try to import child_process for the client
// insist that this is always a dynamic import, even though we don't
// actually ever set this to any different value.

/**
 * Initialize the Tier sidecar.
 *
 * Exported for testing, do not call directly.
 *
 * @internal
 */

/**
 * Method to shut down the auto-started sidecar process on
 * exit.  Exported for testing, do not call directly.
 *
 * @internal
 */
/* c8 ignore start */
export const exitHandler = (_: number, signal: string | null) => {
  if (sidecarPID) {
    PROCESS.kill(sidecarPID, signal || 'SIGTERM')
  }
}
/* c8 ignore stop */

/**
 * Release Metadata
 * 
 * Single source of truth for version info.
 * Used by: pages, logs, bug reports, release-check.
 */

export const RELEASE = {
  /** Semantic version */
  version: '4.4.0',
  /** Release channel */
  channel: 'Release',
  /** Build date (YYYY-MM-DD) */
  buildDate: '2026-07-01',
  /** Build month */
  build: '2026-07',
  /** Pipeline engine version */
  engineVersion: 'Pipeline V4',
  /** Pipeline status */
  pipeline: 'Stable',
  /** Architecture status */
  status: 'Freeze',
  /** Feng Shui rules count */
  rules: 101,
  /** Knowledge base entries count */
  knowledge: 76,
}

export const RELEASE_BANNER = `
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    玄风风水推演引擎                                          ║
║    Version ${RELEASE.version} ${RELEASE.channel}                        ║
║    Pipeline ${RELEASE.pipeline}                                     ║
║    Rules: ${RELEASE.rules}  Knowledge: ${RELEASE.knowledge}                      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`

export default RELEASE
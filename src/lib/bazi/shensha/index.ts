export * from './types'
export * from './shenshaRegistry'
import { globalShenShaRegistry } from './shenshaRegistry'
import DEFINITIONS from './definitions'
DEFINITIONS.forEach(d => globalShenShaRegistry.register(d))
export { DEFINITIONS }

export * from './types'
export * from './knowledge'
export * from './graph'
export * from './citations'
export * from './combinations'
export * from './priority'
export * from './score'
export * from './evidence'
export * from './explain'
export * from './tengodClassifier'
export * from './tengodEngine'
export * from './batch'
export * from './plugin'

let _regressionLoaded = false
let _regressionExports: any = {}

try {
  const mod = require('./regression')
  _regressionLoaded = true
  _regressionExports = mod
} catch (_) {
  _regressionLoaded = false
  _regressionExports = {
    TenGodRegressionRunner: class TenGodRegressionRunnerStub {
      async run(_opts?: any): Promise<any> {
        return { skipped: true, note: 'regression module not yet available' }
      }
    },
  }
  _regressionExports.defaultTenGodRegressionRunner = new _regressionExports.TenGodRegressionRunner()
}

export const { TenGodRegressionRunner, defaultTenGodRegressionRunner } = _regressionExports
export { _regressionLoaded as __regressionModuleLoaded }

import { TenGodPlugin } from './plugin'
export const defaultTenGodPlugin = new TenGodPlugin()

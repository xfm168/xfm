// Preload shim: expose `require` globally BEFORE any ESM module that uses it is evaluated.
// The qimenStandaloneProvider uses `require('date-chinese')` at module-load time, which
// crashes under native ESM. Importing this module FIRST ensures globalThis.require exists.
import { createRequire } from 'module'
;(globalThis).require = createRequire(import.meta.url)

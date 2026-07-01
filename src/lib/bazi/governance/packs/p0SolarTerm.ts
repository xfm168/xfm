/**
 * P0-① Rule Pack - 节气精确到时分秒
 * V4.8.1 Baseline
 *
 * 包含本模块全部规则（已冻结为 Stable）：
 *   RULE-PP-021  节气秒级精度
 *   RULE-PP-069  立春分年（秒级边界）
 *
 * 被引用：solarTerms.ts -> explainSolarTerms()
 */

import { createRuleMeta, freezeRule, type RuleMeta } from '../../rules/meta'
import { createRulePack, type RulePack } from '../rulePack'

const BASELINE = 'V4.8.1-Final'

function buildRule021(): RuleMeta {
  return freezeRule(
    createRuleMeta({
      id: 'RULE-PP-021',
      title: '节气秒级精度',
      author: 'xuanfeng-core',
      source: ['寿星天文历（ShouXing）', 'qimendunjia-standalone v0.1.0'],
      sourceLevel: 1,
      category: 'paipan-solar-term',
      priority: 100,
      evidence: {
        level: 'A',
        reason: '基于天文历算，秒级精度由库返回的 Date 对象直接保留',
        classicSupport: 100,
        commercialAgreement: 100,
        casePassRate: 100,
      },
    }),
    'xuanfeng-review',
  )
}

function buildRule069(): RuleMeta {
  return freezeRule(
    createRuleMeta({
      id: 'RULE-PP-069',
      title: '立春分年（秒级边界）',
      author: 'xuanfeng-core',
      source: ['三命通会', '渊海子平', '寿星天文历'],
      sourceLevel: 1,
      category: 'paipan-year-pillar',
      priority: 100,
      evidence: {
        level: 'A',
        reason: '年柱以立春精确时刻分界，古法共识；秒级边界由天文历确定',
        classicSupport: 100,
        commercialAgreement: 100,
        casePassRate: 100,
      },
    }),
    'xuanfeng-review',
  )
}

export const P0_SOLAR_TERM_RULES: RuleMeta[] = [buildRule021(), buildRule069()]

export const P0_SOLAR_TERM_PACK: RulePack = createRulePack({
  id: 'PACK-P0-01',
  module: 'P0-①',
  name: '节气精确到时分秒',
  version: '1.0.0',
  baseline: BASELINE,
  rules: P0_SOLAR_TERM_RULES,
})

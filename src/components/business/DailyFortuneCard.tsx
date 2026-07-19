/**
 * DailyFortuneCard 每日运势卡片
 * 基于日柱天干地支生成每日运势
 */
import React from 'react'
import './DailyFortuneCard.css'

var FORTUNE_TYPES = ['大吉', '中吉', '小吉', '平', '小凶', '凶']
var FORTUNE_COLORS = { '大吉': '#2ecc71', '中吉': '#3498db', '小吉': '#f39c12', '平': '#6b7394', '小凶': '#e67e22', '凶': '#e74c3c' }
var FORTUNE_AREAS = ['事业运', '财运', '感情运', '健康运', '学业运']

function getDailyFortuneSeed(): number {
  var d = new Date()
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
}

function generateFortune(): { type: string; areas: Array<{ name: string; score: number; text: string }> } {
  var seed = getDailyFortuneSeed()
  var hash = seed * 2654435761
  var typeIndex = Math.abs(hash % 6)
  var areas = FORTUNE_AREAS.map(function(name, i) {
    var areaHash = Math.abs((hash + i * 1103515245) % 100)
    return {
      name: name,
      score: areaHash,
      text: areaHash >= 80 ? '运势旺盛' : areaHash >= 60 ? '较为顺利' : areaHash >= 40 ? '平平稳稳' : areaHash >= 20 ? '稍有波折' : '需要谨慎',
    }
  })
  return { type: FORTUNE_TYPES[typeIndex], areas: areas }
}

function DailyFortuneCard() {
  var fortune = generateFortune()
  var color = FORTUNE_COLORS[fortune.type] || '#6b7394'

  return React.createElement('div', { className: 'dfc-card' },
    React.createElement('div', { className: 'dfc-header' },
      React.createElement('span', { className: 'dfc-label' }, '今日运势'),
      React.createElement('span', { className: 'dfc-date' }, new Date().toLocaleDateString('zh-CN'))
    ),
    React.createElement('div', { className: 'dfc-fortune-type', style: { color: color, borderColor: color } }, fortune.type),
    React.createElement('div', { className: 'dfc-areas' },
      fortune.areas.map(function(area, i) {
        return React.createElement('div', { key: i, className: 'dfc-area' },
          React.createElement('span', { className: 'dfc-area-name' }, area.name),
          React.createElement('div', { className: 'dfc-area-bar-wrap' },
            React.createElement('div', { className: 'dfc-area-bar', style: { width: area.score + '%', background: color } })
          ),
          React.createElement('span', { className: 'dfc-area-text' }, area.text)
        )
      })
    )
  )
}

export { DailyFortuneCard }

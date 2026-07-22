import React from 'react'
import './ShareCard.css'

var SHARE_TYPES = {
  'bazi': '八字分析',
  'fortune': '今日运势',
  'report': '专业报告',
}

function ShareCard(props: any) {
  var type = props.type || 'bazi'
  var data = props.data || {}
  var title = SHARE_TYPES[type] || '玄风门'

  return React.createElement('div', { className: 'share-card share-card-' + type },
    React.createElement('div', { className: 'sc-header' },
      React.createElement('span', { className: 'sc-brand' }, '玄风门'),
      React.createElement('span', { className: 'sc-type' }, title)
    ),
    React.createElement('div', { className: 'sc-body' },
      renderCardBody(type, data)
    ),
    React.createElement('div', { className: 'sc-footer' },
      React.createElement('span', { className: 'sc-scan' }, '扫码查看完整分析'),
      React.createElement('span', { className: 'sc-url' }, 'xuanfengmen.com')
    )
  )
}

function renderCardBody(type: string, data: any) {
  if (type === 'bazi') {
    var pillars = data.pillars || []
    return React.createElement('div', { className: 'sc-bazi' },
      React.createElement('div', { className: 'sc-four-pillars' },
        pillars.map(function(p: any, i: number) {
          return React.createElement('div', { key: i, className: 'sc-pillar' },
            React.createElement('div', { className: 'sc-pillar-label' }, ['年柱','月柱','日柱','时柱'][i] || ''),
            React.createElement('div', { className: 'sc-pillar-gan' }, p.gan || p.stem || '—'),
            React.createElement('div', { className: 'sc-pillar-zhi' }, p.zhi || p.branch || '—'),
          )
        })
      ),
      React.createElement('div', { className: 'sc-bazi-summary' },
        '日主 ' + (data.dayMaster || '—') + '（' + (data.element || '—') + '） · ' +
        (data.strength || '中和')
      )
    )
  }
  if (type === 'fortune') {
    return React.createElement('div', { className: 'sc-fortune' },
      React.createElement('div', { className: 'sc-fortune-type' }, data.type || '平'),
      React.createElement('div', { className: 'sc-fortune-areas' },
        (data.areas || []).map(function(a: any, i: number) {
          return React.createElement('div', { key: i, className: 'sc-fortune-area' },
            React.createElement('span', { className: 'sc-area-name' }, a.name),
            React.createElement('span', { className: 'sc-area-score' }, a.score + '分')
          )
        })
      )
    )
  }
  if (type === 'report') {
    return React.createElement('div', { className: 'sc-report' },
      React.createElement('div', { className: 'sc-report-title' }, data.title || '命理分析报告'),
      React.createElement('div', { className: 'sc-report-summary' }, data.summary || ''),
      React.createElement('div', { className: 'sc-report-badge' }, '专属命理报告')
    )
  }
  return React.createElement('div', { className: 'sc-empty' }, '暂无数据')
}

/** 生成分享文案 */
function generateShareText(type: string, data: any): string {
  if (type === 'bazi') {
    return '我在玄风门做了八字排盘，日主' + (data.dayMaster || '') + '，五行' + (data.element || '') + '。来测测你的八字吧！'
  }
  if (type === 'fortune') {
    return '今日运势：' + (data.type || '平') + '。事业运' + ((data.areas && data.areas[0] && data.areas[0].text) || '') + '。查看你的每日运势→'
  }
  if (type === 'report') {
    return '玄风门专业命理报告：' + (data.title || '') + '。深度推演 + 五维分析，了解你的事业、财运、感情走向。'
  }
  return '来玄风门测测你的八字命理→'
}

export { ShareCard, generateShareText, SHARE_TYPES }
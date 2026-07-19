/**
 * FAQSection 常见问题
 * 玄风门相关 FAQ，手风琴展开/折叠
 */
import React from 'react'
import './FAQSection.css'

var FAQ_LIST = [
  {
    title: '玄风门是什么？',
    content: '玄风门是一个专业的八字命理分析平台，融合传统命理学与现代技术。我们通过严谨的八字排盘引擎，结合 AI 深度解读，为您提供个性化的命理分析报告，涵盖事业、财运、感情、健康等多个维度。',
  },
  {
    title: '八字排盘准吗？',
    content: '玄风门的八字排盘引擎经过 140+ 测试用例覆盖，确保天干地支、五行生克、十神关系等核心算法的准确性。排盘结果基于传统命理学理论，同时引入 AI 辅助解读，在保持传统准确性的基础上提供更丰富的分析视角。',
  },
  {
    title: '免费用户和会员有什么区别？',
    content: '免费用户每日可进行 3 次排盘和 1 次基础分析，查看基础报告。会员用户则可享受更多排盘次数、完整八字分析报告、PDF 导出、AI 深度解读、流年分析等高级功能。不同会员等级的权益有所差异，具体可在会员页面查看对比。',
  },
  {
    title: '如何升级会员？',
    content: '您可以通过以下步骤升级会员：1. 登录您的玄风门账号；2. 进入「会员中心」页面；3. 选择适合您的会员方案；4. 完成支付即可立即生效。我们支持多种支付方式，升级后权益即刻生效。',
  },
  {
    title: '支付安全吗？',
    content: '绝对安全。玄风门采用业界标准的支付流程，所有支付请求均通过 JWT 认证和 Webhook 签名验证，确保交易数据的完整性和安全性。我们不存储任何支付敏感信息，支付过程由第三方支付平台处理，符合金融级安全标准。',
  },
  {
    title: '分析结果可以保存吗？',
    content: '可以。所有分析结果会自动保存在您的账户中，您可以随时在「我的报告」中查看历史记录。免费用户可保存 5 条历史记录，会员用户可保存更多，高级会员享受无限历史记录。您也可以将报告导出为 PDF 格式保存到本地。',
  },
  {
    title: '可以退款吗？',
    content: '玄风门提供合理的退款政策。如果您在购买会员后 7 天内对服务不满意，可以申请退款。退款将按照原支付方式退回，到账时间视支付渠道而定。具体退款流程请联系客服或查看退款政策页面。请注意，已使用的 AI 解读次数可能影响退款金额。',
  },
]

function FAQSection() {
  var _state = React.useState(-1)
  var openIndex = _state[0]
  var setOpenIndex = _state[1]

  return React.createElement('div', { className: 'faq-section' },
    React.createElement('h2', { className: 'faq-title' }, '常见问题'),
    React.createElement('div', { className: 'faq-list' },
      FAQ_LIST.map(function(item, i) {
        return React.createElement('div', { key: i, className: 'faq-item' },
          React.createElement('button',
            {
              className: 'faq-question' + (openIndex === i ? ' faq-question-open' : ''),
              onClick: function() { setOpenIndex(openIndex === i ? -1 : i) },
              'aria-expanded': openIndex === i ? 'true' : 'false',
            },
            React.createElement('span', { className: 'faq-question-text' }, item.title),
            React.createElement('span', { className: 'faq-arrow' }, openIndex === i ? '\u25B2' : '\u25BC')
          ),
          openIndex === i
            ? React.createElement('div', { className: 'faq-answer', role: 'region' }, item.content)
            : null
        )
      })
    )
  )
}

export { FAQSection }

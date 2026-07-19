import { useState } from 'react'
import { usePageSEO } from '../hooks/usePageSEO'
import './Legal.css'

type LegalTab = 'privacy' | 'terms' | 'disclaimer'

export default function Legal() {
  const [activeTab, setActiveTab] = useState<LegalTab>('privacy')

  usePageSEO({
    title: '法律信息 | 玄风门',
    description: '玄风门隐私政策、用户服务协议和免责声明。',
    noindex: true
  })

  return (
    <div className="legal-page">
      <div className="container">
        <div className="legal-header">
          <h1 className="legal-title">法律信息</h1>
          <p className="legal-subtitle">玄风门法律声明与用户协议</p>
        </div>

        <div className="legal-tabs">
          <button
            className={'legal-tab' + (activeTab === 'privacy' ? ' active' : '')}
            onClick={() => setActiveTab('privacy')}
            aria-label="隐私政策"
          >
            隐私政策
          </button>
          <button
            className={'legal-tab' + (activeTab === 'terms' ? ' active' : '')}
            onClick={() => setActiveTab('terms')}
            aria-label="用户协议"
          >
            用户协议
          </button>
          <button
            className={'legal-tab' + (activeTab === 'disclaimer' ? ' active' : '')}
            onClick={() => setActiveTab('disclaimer')}
            aria-label="免责声明"
          >
            免责声明
          </button>
        </div>

        <div className="legal-content">
          {activeTab === 'privacy' && <PrivacyContent />}
          {activeTab === 'terms' && <TermsContent />}
          {activeTab === 'disclaimer' && <DisclaimerContent />}
        </div>
      </div>
    </div>
  )
}

function PrivacyContent() {
  return (
    <div className="legal-section">
      <h2>隐私政策</h2>
      <p className="legal-update">最后更新日期：2026年7月13日</p>

      <h3>一、信息收集</h3>
      <p>玄风门（以下简称"我们"）在您使用服务时，可能收集以下信息：</p>
      <ul>
        <li><strong>账户信息</strong>：注册时提供的手机号或邮箱地址。</li>
        <li><strong>使用数据</strong>：您进行八字推算、风水分析、六爻占卜时输入的生辰、空间照片等数据。</li>
        <li><strong>设备信息</strong>：浏览器类型、操作系统、访问时间等日志数据。</li>
      </ul>

      <h3>二、信息使用</h3>
      <p>我们收集的信息用于以下目的：</p>
      <ul>
        <li>提供中国传统命理、风水、占卜等推演服务。</li>
        <li>改善和优化我们的服务体验。</li>
        <li>向您发送与服务相关的重要通知。</li>
        <li>履行法律法规规定的义务。</li>
      </ul>

      <h3>三、信息存储与保护</h3>
      <p>我们采用业界通行的安全措施保护您的个人信息，包括但不限于数据加密传输（TLS/SSL）、访问控制、定期安全审计。您的个人信息存储在中国大陆境内。</p>

      <h3>四、信息共享</h3>
      <p>我们不会将您的个人信息出售给第三方。仅在以下情形下共享：</p>
      <ul>
        <li>获得您的明确同意。</li>
        <li>法律法规要求或政府机关依法要求。</li>
        <li>与我们的服务提供商（如云服务商）共享，但仅限于提供服务所必需。</li>
      </ul>

      <h3>五、您的权利</h3>
      <p>您有权查阅、更正、删除您的个人信息，也有权撤回同意、注销账户。如需行使上述权利，请通过官方渠道联系我们。</p>

      <h3>六、未成年人保护</h3>
      <p>我们的服务面向成年人。如果您未满18周岁，请在监护人陪同下使用服务。</p>

      <h3>七、政策更新</h3>
      <p>我们可能会不时更新本隐私政策。更新后的政策将在本页面发布时生效。</p>

      <h3>八、联系方式</h3>
      <p>如对本隐私政策有任何疑问，请通过以下方式联系我们：</p>
      <p>邮箱：privacy@xuanfengmen.com</p>
    </div>
  )
}

function TermsContent() {
  return (
    <div className="legal-section">
      <h2>用户服务协议</h2>
      <p className="legal-update">最后更新日期：2026年7月13日</p>

      <h3>一、服务说明</h3>
      <p>玄风门（以下简称"本站"）提供中国传统命理（八字）、风水、六爻占卜、每日卦运等传统文化信息服务。所有推演结果仅供文化参考和娱乐用途，不构成任何形式的专业建议（包括但不限于医疗、法律、金融、投资建议）。</p>

      <h3>二、用户注册与账户</h3>
      <p>使用本站服务前，您需要注册账户。您应提供真实、准确、完整的注册信息，并妥善保管账户密码。您对账户下的所有活动承担责任。</p>

      <h3>三、用户行为规范</h3>
      <p>您在使用本站服务时，不得：</p>
      <ul>
        <li>利用本站服务从事任何违法违规活动。</li>
        <li>干扰或破坏本站服务的正常运行。</li>
        <li>未经授权访问或使用其他用户的账户。</li>
        <li>利用本站服务进行恶意攻击、骚扰、诈骗等行为。</li>
        <li>上传含有病毒、恶意代码的文件或图片。</li>
      </ul>

      <h3>四、知识产权</h3>
      <p>本站的所有内容（包括但不限于文字、图形、标志、页面设计、软件代码）的知识产权归本站所有，受中国法律保护。未经书面许可，任何人不得以任何方式复制、转载、修改、链接、镜像本站内容。</p>

      <h3>五、会员服务</h3>
      <p>本站提供免费和付费会员服务。付费会员的具体权益、价格、退款政策详见会员中心页面。本站保留调整会员权益和价格的权利，调整前将提前通知。</p>

      <h3>六、免责条款</h3>
      <p>详见《免责声明》页面。</p>

      <h3>七、协议修改</h3>
      <p>本站有权根据需要修改本协议。修改后的协议将在本页面发布，重大变更将通过适当方式通知用户。</p>

      <h3>八、法律适用</h3>
      <p>本协议适用中华人民共和国法律。因本协议引起的或与本协议有关的争议，双方应友好协商解决；协商不成的，提交有管辖权的人民法院解决。</p>
    </div>
  )
}

function DisclaimerContent() {
  return (
    <div className="legal-section">
      <h2>免责声明</h2>
      <p className="legal-update">最后更新日期：2026年7月13日</p>

      <h3>一、传统文化服务声明</h3>
      <p>玄风门提供的所有服务——包括八字推演、风水分析、六爻占卜、每日卦运等——均基于中国传统命理学和占卜学理论，属于传统文化信息服务。本站不宣称这些服务具有任何科学依据或超自然效力。</p>

      <h3>二、非专业建议</h3>
      <p>本站提供的推演结果、分析报告、建议等内容，仅供文化参考和娱乐目的。这些内容不构成也不应被视为：</p>
      <ul>
        <li>医疗诊断、治疗建议或健康咨询。</li>
        <li>法律意见或法律建议。</li>
        <li>投资、理财、金融建议。</li>
        <li>心理咨询或心理治疗。</li>
        <li>任何形式的专业建议。</li>
      </ul>
      <p>如您需要上述任何领域的专业服务，请咨询具备相应资质的专业人士。</p>

      <h3>三、推演结果的不确定性</h3>
      <p>本站基于传统命理学算法进行推演，但推演结果的准确性受到多种因素影响，包括但不限于：输入数据的准确性、算法的局限性、传统命理学理论本身的多样性。本站不保证推演结果的准确性、完整性和适用性。</p>

      <h3>四、用户独立判断</h3>
      <p>用户应基于自身独立判断和理性思考做出决策。本站不对因依赖推演结果而做出的任何决策承担任何责任。</p>

      <h3>五、第三方服务</h3>
      <p>本站可能包含第三方服务（如支付、云服务）的链接或集成。本站不对第三方服务的内容、隐私政策、安全性承担责任。</p>

      <h3>六、服务可用性</h3>
      <p>本站尽力保证服务的稳定性和可用性，但不对因系统维护、网络故障、不可抗力等因素导致的服务中断或数据丢失承担责任。</p>

      <h3>七、责任限制</h3>
      <p>在法律允许的最大范围内，本站不对因使用或无法使用本站服务而产生的任何直接、间接、附带、特殊或后果性损害承担责任。</p>
    </div>
  )
}
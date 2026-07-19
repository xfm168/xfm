/**
 * JSON-LD 结构化数据生成
 */

function generateOrganizationLd(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: '玄风门 XuanFengMen',
    url: 'https://xuanfengmen.com',
    description: '专业八字命理分析平台',
  }
}

function generateArticleLd(article: { title: string; description: string; slug: string; datePublished: string; dateModified: string }): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    url: 'https://xuanfengmen.com/knowledge/' + article.slug,
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    author: { '@type': 'Organization', name: '玄风门' },
  }
}

function generateFAQLd(faqs: Array<{ question: string; answer: string }>): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(function(faq) {
      return {
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      }
    }),
  }
}

function injectJsonLd(data: object): void {
  if (typeof document === 'undefined') return
  var existing = document.getElementById('json-ld')
  if (existing) existing.remove()
  var script = document.createElement('script')
  script.type = 'application/ld+json'
  script.id = 'json-ld'
  script.textContent = JSON.stringify(data)
  document.head.appendChild(script)
}

export { generateOrganizationLd, generateArticleLd, generateFAQLd, injectJsonLd }
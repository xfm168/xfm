/**
 * SEO 自动生成工具
 * 生成 sitemap、robots、RSS、城市落地页、FAQ Schema、面包屑 Schema
 */

interface RouteItem {
  path: string
  priority?: number
  changefreq?: string
  lastmod?: string
}

interface RobotsRule {
  userAgent: string
  allow?: string[]
  disallow?: string[]
  crawlDelay?: number
}

interface RSSItem {
  title: string
  link: string
  description: string
  pubDate: string
  guid?: string
}

interface CityData {
  name: string
  pinyin: string
  baziFeature: string
  fengshuiFeature: string
}

interface FAQItem {
  question: string
  answer: string
}

interface BreadcrumbItem {
  name: string
  url: string
}

export function generateSitemap(routes: RouteItem[]): string {
  var urls = routes.map(function(route) {
    var priority = route.priority != null ? route.priority : 0.5
    var changefreq = route.changefreq || 'weekly'
    var lastmod = route.lastmod || new Date().toISOString().split('T')[0]
    return (
      '  <url>\n' +
      '    <loc>https://xuanfengmen.com' + route.path + '</loc>\n' +
      '    <lastmod>' + lastmod + '</lastmod>\n' +
      '    <changefreq>' + changefreq + '</changefreq>\n' +
      '    <priority>' + priority.toFixed(1) + '</priority>\n' +
      '  </url>'
    )
  })

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.join('\n') + '\n' +
    '</urlset>'
  )
}

export function generateRobots(rules: RobotsRule[]): string {
  var lines: string[] = []
  for (var i = 0; i < rules.length; i++) {
    var rule = rules[i]
    lines.push('User-agent: ' + rule.userAgent)
    if (rule.allow) {
      for (var j = 0; j < rule.allow.length; j++) {
        lines.push('Allow: ' + rule.allow[j])
      }
    }
    if (rule.disallow) {
      for (var k = 0; k < rule.disallow.length; k++) {
        lines.push('Disallow: ' + rule.disallow[k])
      }
    }
    if (rule.crawlDelay != null) {
      lines.push('Crawl-delay: ' + rule.crawlDelay)
    }
    lines.push('')
  }
  lines.push('Sitemap: https://xuanfengmen.com/sitemap.xml')
  return lines.join('\n')
}

export function generateRSS(items: RSSItem[]): string {
  var channelItems = items.map(function(item) {
    var guid = item.guid || item.link
    return (
      '    <item>\n' +
      '      <title><![CDATA[' + item.title + ']]></title>\n' +
      '      <link>' + item.link + '</link>\n' +
      '      <description><![CDATA[' + item.description + ']]></description>\n' +
      '      <pubDate>' + item.pubDate + '</pubDate>\n' +
      '      <guid>' + guid + '</guid>\n' +
      '    </item>'
    )
  })

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<rss version="2.0">\n' +
    '  <channel>\n' +
    '    <title>玄风门 - 智能命理与风水分析平台</title>\n' +
    '    <link>https://xuanfengmen.com</link>\n' +
    '    <description>提供八字排盘、风水堪测、六爻占卜、每日卦运等AI驱动的命理服务</description>\n' +
    '    <language>zh-CN</language>\n' +
    channelItems.join('\n') + '\n' +
    '  </channel>\n' +
    '</rss>'
  )
}

export function generateCityLandingPage(city: CityData): string {
  var title = city.name + '八字命理与风水分析 - 玄风门'
  var metaDesc = city.name + '专属的八字排盘、风水堪测与运势分析服务。结合' +
    city.baziFeature + '与' + city.fengshuiFeature + '，为您解读命理玄机。'

  var baziSection = (
    '<section class="city-bazi">\n' +
    '  <h2>' + city.name + '八字命理特色</h2>\n' +
    '  <p>' + city.baziFeature + '</p>\n' +
    '  <ul>\n' +
    '    <li>基于本地真太阳时的精准排盘</li>\n' +
    '    <li>结合' + city.name + '地理气候的五行分析</li>\n' +
    '    <li>本地化的十神与格局解读</li>\n' +
    '  </ul>\n' +
    '</section>'
  )

  var fengshuiSection = (
    '<section class="city-fengshui">\n' +
    '  <h2>' + city.name + '风水堪测特色</h2>\n' +
    '  <p>' + city.fengshuiFeature + '</p>\n' +
    '  <ul>\n' +
    '    <li>针对' + city.name + '气候的室内布局建议</li>\n' +
    '    <li>本地朝向与采光优化方案</li>\n' +
    '    <li>结合城市地形的能量流分析</li>\n' +
    '  </ul>\n' +
    '</section>'
  )

  return (
    '<!DOCTYPE html>\n' +
    '<html lang="zh-CN">\n' +
    '<head>\n' +
    '  <meta charset="UTF-8">\n' +
    '  <title>' + title + '</title>\n' +
    '  <meta name="description" content="' + metaDesc + '">\n' +
    '  <link rel="canonical" href="https://xuanfengmen.com/city/' + city.pinyin + '">\n' +
    '</head>\n' +
    '<body>\n' +
    '  <h1>' + city.name + '智能命理分析</h1>\n' +
    '  <p class="lead">' + metaDesc + '</p>\n' +
    baziSection + '\n' +
    fengshuiSection + '\n' +
    '</body>\n' +
    '</html>'
  )
}

export function generateFAQPage(faqs: FAQItem[]): string {
  var questions = faqs.map(function(faq, index) {
    return {
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }
  })

  var schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions
  }

  return (
    '<script type="application/ld+json">\n' +
    JSON.stringify(schema, null, 2) + '\n' +
    '</script>'
  )
}

export function generateBreadcrumb(items: BreadcrumbItem[]): string {
  var listItems = items.map(function(item, index) {
    return {
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }
  })

  var schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: listItems
  }

  return (
    '<script type="application/ld+json">\n' +
    JSON.stringify(schema, null, 2) + '\n' +
    '</script>'
  )
}

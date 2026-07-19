import { Hono } from 'hono'
import { CATEGORIES, ARTICLES } from '../../lib/knowledgeData'

var app = new Hono()

app.get('/', function(c) {
  var baseUrl = process.env.SITE_URL || 'https://xuanfengmen.com'
  var urls: string[] = []

  // 首页
  urls.push(makeUrl(baseUrl + '/', '1.0', 'daily'))

  // 主要功能页
  urls.push(makeUrl(baseUrl + '/bazi', '0.9', 'weekly'))
  urls.push(makeUrl(baseUrl + '/fengshui', '0.9', 'weekly'))
  urls.push(makeUrl(baseUrl + '/liuyao', '0.9', 'weekly'))
  urls.push(makeUrl(baseUrl + '/daily', '0.8', 'weekly'))
  urls.push(makeUrl(baseUrl + '/membership', '0.7', 'monthly'))

  // 知识中心首页
  urls.push(makeUrl(baseUrl + '/knowledge', '0.9', 'weekly'))

  // 知识中心分类页
  CATEGORIES.forEach(function(cat) {
    urls.push(makeUrl(baseUrl + '/knowledge/' + cat.id, '0.8', 'weekly'))
  })

  // 知识文章页
  Object.keys(ARTICLES).forEach(function(catId) {
    ARTICLES[catId].forEach(function(article) {
      urls.push(makeUrl(baseUrl + '/knowledge/' + catId + '/' + article.slug, '0.6', 'monthly'))
    })
  })

  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.join('\n') +
    '\n</urlset>'

  c.header('Content-Type', 'application/xml')
  return c.body(xml)
})

function makeUrl(loc: string, priority: string, freq: string): string {
  return '  <url><loc>' + loc + '</loc><priority>' + priority + '</priority><changefreq>' + freq + '</changefreq></url>'
}

export default app
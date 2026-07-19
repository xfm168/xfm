/**
 * 知识中心页面 — 分类浏览 + 文章列表 + 文章详情 Modal
 */

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { CATEGORIES, ARTICLES, getArticlesByCategory, getTotalArticleCount, type KnowledgeArticle, type KnowledgeCategory } from '../lib/knowledgeData'
import { usePageSEO } from '../hooks/usePageSEO'
import { generateArticleLd, injectJsonLd, generateFAQLd } from '../lib/seo/jsonLd'
import Modal from '../components/ui/Modal/Modal'
import './KnowledgeCenter.css'

function KnowledgeCenter() {
  var params = useParams()
  var categorySlug = params.categorySlug || ''
  var articleSlug = params.articleSlug || ''

  var [activeCategoryId, setActiveCategoryId] = useState<string>(
    categorySlug ? categorySlug : CATEGORIES[0].id
  )
  var [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null)
  var [modalOpen, setModalOpen] = useState(false)

  // 从 URL 参数初始化分类高亮
  useEffect(function() {
    if (categorySlug) {
      var matched = CATEGORIES.find(function(c) { return c.id === categorySlug })
      if (matched) setActiveCategoryId(categorySlug)
    }
    // 如果有 articleSlug，自动打开对应文章
    if (categorySlug && articleSlug) {
      var catArticles = ARTICLES[categorySlug] || []
      var found = null
      for (var i = 0; i < catArticles.length; i++) {
        if (catArticles[i].slug === articleSlug) {
          found = catArticles[i]
          break
        }
      }
      if (found) {
        setSelectedArticle(found)
        setModalOpen(true)
      }
    }
  }, [categorySlug, articleSlug])

  var activeCategory: KnowledgeCategory | undefined = CATEGORIES.find(function(c) { return c.id === activeCategoryId })
  var articles = getArticlesByCategory(activeCategoryId)
  var totalArticles = getTotalArticleCount()

  // SEO
  var categoryName = activeCategory ? activeCategory.name : ''
  var canonicalPath = 'https://xuanfengmen.com/knowledge'
  if (categorySlug) canonicalPath = canonicalPath + '/' + categorySlug
  if (articleSlug) canonicalPath = canonicalPath + '/' + articleSlug

  usePageSEO({
    title: '知识中心 | ' + categoryName,
    description: '玄风门知识中心，涵盖八字百科、十神百科、五行百科、天干地支、六十四卦、风水百科、命理术语等' + totalArticles + '篇专业文章。',
    keywords: '命理知识,八字百科,十神,五行,天干地支,六十四卦,风水,命理术语',
    ogTitle: '玄风门知识中心',
    ogDescription: '专业命理知识百科，涵盖八字、十神、五行、风水等七大分类。',
    canonical: canonicalPath,
  })

  // JSON-LD: 注入知识中心 FAQ 结构化数据
  useEffect(function() {
    var faqs = [
      { question: '什么是八字命理？', answer: '八字命理是根据出生年、月、日、时，以天干地支排列组合推算命运吉凶的中国传统术数。' },
      { question: '十神包括哪些？', answer: '十神包括正官、七杀、正财、偏财、食神、伤官、正印、偏印、比肩、劫财十种关系。' },
      { question: '五行相生相克是什么？', answer: '五行相生为木生火、火生土、土生金、金生水、水生木；相克为木克土、土克水、水克火、火克金、金克木。' },
    ]
    var ld = generateFAQLd(faqs)
    injectJsonLd(ld)

    return function() {
      var el = document.getElementById('json-ld')
      if (el) el.remove()
    }
  }, [])

  function handleArticleClick(article: KnowledgeArticle) {
    setSelectedArticle(article)
    setModalOpen(true)

    // 注入文章 JSON-LD
    var articleLd = generateArticleLd({
      title: article.title,
      description: article.summary,
      slug: article.slug,
      datePublished: '2026-07-18',
      dateModified: '2026-07-18',
    })
    injectJsonLd(articleLd)
  }

  function handleModalClose() {
    setModalOpen(false)
    setSelectedArticle(null)
  }

  return (
    <div className="kc-container">
      {/* 页面头部 */}
      <div className="kc-header">
        <h1 className="kc-title">知识中心</h1>
        <p className="kc-subtitle">
          系统学习命理知识，涵盖{CATEGORIES.length}大分类、{totalArticles}篇专业文章
        </p>
      </div>

      {/* 主体布局：左侧分类 + 右侧文章 */}
      <div className="kc-layout">
        {/* 左侧分类列表 */}
        <nav className="kc-sidebar" aria-label="知识分类">
          <ul className="kc-category-list">
            {CATEGORIES.map(function(cat) {
              var isActive = cat.id === activeCategoryId
              var count = (ARTICLES[cat.id] || []).length
              return (
                <li key={cat.id}>
                  <button
                    className={'kc-category-btn' + (isActive ? ' kc-category-btn--active' : '')}
                    onClick={function() { setActiveCategoryId(cat.id) }}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="kc-category-icon">{cat.icon}</span>
                    <span className="kc-category-name">{cat.name}</span>
                    <span className="kc-category-count">{count}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* 右侧文章列表 */}
        <section className="kc-content">
          <div className="kc-content-header">
            <h2 className="kc-content-title">
              {activeCategory ? activeCategory.icon + ' ' + activeCategory.name : ''}
            </h2>
            <p className="kc-content-desc">
              {activeCategory ? activeCategory.description : ''}
            </p>
          </div>

          <div className="kc-article-list">
            {articles.length === 0 && (
              <p className="kc-empty">该分类暂无文章</p>
            )}
            {articles.map(function(article) {
              return (
                <article
                  key={article.id}
                  className="kc-article-card"
                  onClick={function() { handleArticleClick(article) }}
                  onKeyDown={function(e) { if (e.key === 'Enter') handleArticleClick(article) }}
                  tabIndex={0}
                  role="button"
                  aria-label={'阅读：' + article.title}
                >
                  <h3 className="kc-article-title">{article.title}</h3>
                  <p className="kc-article-summary">{article.summary}</p>
                  <span className="kc-article-link">阅读全文 &rarr;</span>
                </article>
              )
            })}
          </div>
        </section>
      </div>

      {/* 文章详情 Modal */}
      <Modal
        open={modalOpen}
        onClose={handleModalClose}
        title={selectedArticle ? selectedArticle.title : ''}
        className="kc-article-modal"
      >
        {selectedArticle && (
          <div className="kc-article-detail">
            <div className="kc-article-detail-meta">
              <span>知识中心</span>
              <span>&middot;</span>
              <span>{activeCategory ? activeCategory.name : ''}</span>
            </div>
            <p className="kc-article-detail-summary">{selectedArticle.summary}</p>
            <div className="kc-article-detail-body">
              <p>本文内容正在持续完善中，敬请期待完整解读。</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default KnowledgeCenter
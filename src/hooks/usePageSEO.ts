/**
 * usePageSEO — 页面级 SEO 管理
 * 使用原生 document API，无需额外依赖
 * 禁止修改：仅修改 document.title 和 meta，不操作 DOM 结构
 */

import { useEffect } from 'react'

interface SEOMeta {
  title: string
  description?: string
  keywords?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogUrl?: string
  canonical?: string
  noindex?: boolean
}

var DEFAULT_TITLE = '玄风门 - 观其势 · 察其形 · 明其理'

var DEFAULT_DESCRIPTION =
  '玄风门 — 专业八字命理、风水堪测、六爻占卜平台。传承东方智慧，以现代科技推演传统命理。'

function updateMetaTag(name: string, content: string | null) {
  var tag = document.querySelector('meta[name="' + name + '"]') as HTMLMetaElement | null
  if (!tag) {
    if (!content) return
    tag = document.createElement('meta')
    tag.setAttribute('name', name)
    document.head.appendChild(tag)
  }
  if (content) {
    tag.setAttribute('content', content)
  } else {
    tag.remove()
  }
}

function updatePropertyMeta(property: string, content: string | null) {
  var tag = document.querySelector('meta[property="' + property + '"]') as HTMLMetaElement | null
  if (!tag) {
    if (!content) return
    tag = document.createElement('meta')
    tag.setAttribute('property', property)
    document.head.appendChild(tag)
  }
  if (content) {
    tag.setAttribute('content', content)
  } else {
    tag.remove()
  }
}

function updateCanonical(url: string | null) {
  var link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!link) {
    if (!url) return
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  if (url) {
    link.setAttribute('href', url)
  } else {
    link.remove()
  }
}

function updateRobots(noindex: boolean) {
  var tag = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', 'robots')
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large')
}

export function usePageSEO(meta: SEOMeta) {
  useEffect(function() {
    var previousTitle = document.title

    document.title = meta.title || DEFAULT_TITLE
    updateMetaTag('description', meta.description || DEFAULT_DESCRIPTION)
    if (meta.keywords) updateMetaTag('keywords', meta.keywords)
    if (meta.ogTitle) updatePropertyMeta('og:title', meta.ogTitle)
    if (meta.ogDescription) updatePropertyMeta('og:description', meta.ogDescription)
    if (meta.ogImage) updatePropertyMeta('og:image', meta.ogImage)
    if (meta.ogUrl) updatePropertyMeta('og:url', meta.ogUrl)
    if (meta.canonical) updateCanonical(meta.canonical)
    updateRobots(meta.noindex || false)

    return function() {
      document.title = previousTitle
    }
  }, [
    meta.title,
    meta.description,
    meta.keywords,
    meta.ogTitle,
    meta.ogDescription,
    meta.ogImage,
    meta.ogUrl,
    meta.canonical,
    meta.noindex,
  ])
}

export function usePageTitle(title: string) {
  useEffect(function() {
    var previousTitle = document.title
    document.title = title + ' | 玄风门'
    return function() {
      document.title = previousTitle
    }
  }, [title])
}

export default usePageSEO

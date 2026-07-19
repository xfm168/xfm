/**
 * SEO Meta 标签管理 hook
 * 动态设置 document.title 和 meta 标签
 */
import { useEffect } from 'react'

function useSEO(config: { title: string; description: string; keywords?: string; ogType?: string; ogImage?: string }) {
  useEffect(function() {
    document.title = config.title + ' | 玄风门'

    // 设置 description
    setMeta('description', config.description)

    // 设置 keywords
    if (config.keywords) {
      setMeta('keywords', config.keywords)
    }

    // OpenGraph
    setMeta('og:title', config.title, 'property')
    setMeta('og:description', config.description, 'property')
    setMeta('og:type', config.ogType || 'website', 'property')
    if (config.ogImage) {
      setMeta('og:image', config.ogImage, 'property')
    }
  }, [config.title, config.description, config.keywords, config.ogType, config.ogImage])
}

function setMeta(name: string, content: string, attr?: string) {
  attr = attr || 'name'
  var el = document.querySelector('meta[' + attr + '="' + name + '"]') as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export { useSEO }
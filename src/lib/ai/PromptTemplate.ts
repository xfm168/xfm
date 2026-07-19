/**
 * H2.1 Enterprise: Prompt 模板引擎
 *
 * 支持：
 *   {{variable}}       — 变量替换
 *   {{#if condition}}...{{/if}}   — 条件
 *   {{#each items}}...{{/each}}  — 循环
 *   {{> partialName}}    — 引入 partial
 *
 * 不使用字符串拼接，全部配置化。
 */

export class PromptTemplate {
  private partials: Map<string, string> = new Map()

  /** 注册 partial 模板 */
  registerPartial(name: string, template: string): void {
    this.partials.set(name, template)
  }

  /** 渲染模板 */
  render(template: string, data: Record<string, unknown>): string {
    let result = template

    // 1. 处理 partials: {{> partialName}}
    result = result.replace(/\{\{>\s*(\w+)\s*\}\}/g, (_, name) => {
      const partial = this.partials.get(name)
      return partial ? this.render(partial, data) : `[missing partial: ${name}]`
    })

    // 2. 处理 if/else: {{#if value}}...{{else}}...{{/if}}
    result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)(?:\{\{else}\}([\s\S]*?))?\{\{\/if}\}/g, (_, condition, ifBlock, elseBlock) => {
      const value = data[condition]
      return value ? this.render(ifBlock.trim(), data) : (elseBlock ? this.render(elseBlock.trim(), data) : '')
    })

    // 3. 处理 each: {{#each items}}...{{item}}...{{/each}}
    result = result.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each}\}/g, (_, arrayKey, block) => {
      const items = data[arrayKey]
      if (!Array.isArray(items)) return ''
      return items.map((item, index) => {
        const itemData = { ...data, item, index, '@index': index, '@first': index === 0, '@last': index === items.length - 1 }
        return this.render(block.trim(), itemData)
      }).join('\n')
    })

    // 4. 处理变量: {{variable}} (支持 @index, item 等)
    result = result.replace(/\{\{([\w@]+)\}\}/g, (_, key) => {
      const value = data[key]
      if (value === undefined || value === null) return ''
      if (typeof value === 'boolean') return String(value)
      if (typeof value === 'number') return String(value)
      return String(value)
    })

    return result
  }
}
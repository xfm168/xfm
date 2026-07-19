/**
 * H2.1: 统一 Prompt 构建器
 * 
 * 所有 Prompt 集中管理，禁止散落项目。
 */

export type PromptCategory = 'bazi' | 'ziwei' | 'fengshui' | 'face' | 'palm' | 'liuyao' | 'qimen' | 'daily' | 'divination' | 'general'

export interface PromptTemplate {
  category: PromptCategory
  name: string
  version: string
  systemPrompt: string
  userPromptTemplate: string
}

const templates: Map<string, PromptTemplate> = new Map()

export function registerPrompt(template: PromptTemplate): void {
  const key = `${template.category}:${template.name}`
  templates.set(key, template)
}

export function getPrompt(category: PromptCategory, name: string): PromptTemplate | undefined {
  return templates.get(`${category}:${name}`)
}

export function renderPrompt(category: PromptCategory, name: string, variables: Record<string, string>): { system: string; user: string } | undefined {
  const template = getPrompt(category, name)
  if (!template) return undefined

  let userPrompt = template.userPromptTemplate
  for (const [key, value] of Object.entries(variables)) {
    userPrompt = userPrompt.replace(`{{${key}}}`, value)
  }

  return { system: template.systemPrompt, user: userPrompt }
}

export function listPrompts(): PromptTemplate[] {
  return Array.from(templates.values())
}
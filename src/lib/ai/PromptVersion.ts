/**
 * H2.1: Prompt 版本管理
 * 
 * Prompt 升级自动触发 Cache Miss。
 */

export const PROMPT_VERSION = '1.0.0'

const promptVersions: Map<string, string> = new Map()

export function setPromptVersion(category: string, name: string, version: string): void {
  promptVersions.set(`${category}:${name}`, version)
}

export function getPromptVersion(category: string, name: string): string {
  return promptVersions.get(`${category}:${name}`) ?? PROMPT_VERSION
}

export function getPromptVersionKey(category: string, name: string): string {
  return `${category}:${name}:${getPromptVersion(category, name)}`
}
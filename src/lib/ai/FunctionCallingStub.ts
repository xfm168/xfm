/**
 * H2.1 Enterprise P2: Function Calling Stub
 * 
 * 预留接口。AI 调用本地算法，确保命理计算永远正确。
 */

export interface FunctionDefinition {
  name: string
  description: string
  parameters: Record<string, unknown>
  handler: (...args: unknown[]) => Promise<unknown>
}

export interface FunctionCall {
  name: string
  arguments: Record<string, unknown>
}

export interface FunctionCallResult {
  name: string
  success: boolean
  data?: unknown
  error?: string
}

/**
 * Function Calling 注册表。
 * AI 通过此表调用本地算法。
 */
export class FunctionRegistry {
  private functions: Map<string, FunctionDefinition> = new Map()

  register(def: FunctionDefinition): void {
    this.functions.set(def.name, def)
  }

  unregister(name: string): boolean {
    return this.functions.delete(name)
  }

  async call(call: FunctionCall): Promise<FunctionCallResult> {
    const fn = this.functions.get(call.name)
    if (!fn) return { name: call.name, success: false, error: `Function ${call.name} not found` }
    try {
      const data = await fn.handler(call.arguments)
      return { name: call.name, success: true, data }
    } catch (err) {
      return { name: call.name, success: false, error: String(err) }
    }
  }

  list(): FunctionDefinition[] {
    return Array.from(this.functions.values())
  }

  has(name: string): boolean {
    return this.functions.has(name)
  }

  get size(): number {
    return this.functions.size
  }
}

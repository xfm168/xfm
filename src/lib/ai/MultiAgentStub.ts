/**
 * H2.1 Enterprise P2: Multi-Agent Stub
 * 
 * 预留接口。H3 实现 Master-Agent + 专业 Agent 协作。
 */

export interface AgentConfig {
  name: string
  role: string
  description: string
  provider?: string
  model?: string
}

export interface AgentMessage {
  from: string
  to: string
  content: string
  timestamp: number
}

export interface AgentResult {
  agent: string
  success: boolean
  data?: unknown
  error?: string
  messages: AgentMessage[]
  latencyMs: number
}

/**
 * Agent 基类接口。
 */
export interface IAgent {
  readonly name: string
  readonly role: string
  execute(input: unknown): Promise<AgentResult>
}

export class StubAgent implements IAgent {
  constructor(public readonly name: string, public readonly role: string) {}

  async execute(input: unknown): Promise<AgentResult> {
    return {
      agent: this.name,
      success: true,
      data: input,
      messages: [],
      latencyMs: 0,
    }
  }
}

/**
 * H2.1 Enterprise P2: MCP (Model Context Protocol) Stub
 * 
 * 预留接口。后续接入 Claude Desktop / OpenAI / Cursor / Trae。
 */

export interface MCPTool {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  handler: (input: Record<string, unknown>) => Promise<unknown>
}

export interface MCPServerConfig {
  name: string
  version: string
  tools: MCPTool[]
}

/**
 * MCP Server 占位接口。
 * H3 实现完整 MCP 协议支持。
 */
export interface IMCPServer {
  start(): Promise<void>
  stop(): Promise<void>
  listTools(): MCPTool[]
  callTool(name: string, input: Record<string, unknown>): Promise<unknown>
}

export class StubMCPServer implements IMCPServer {
  private tools: Map<string, MCPTool> = new Map()

  constructor(config?: MCPServerConfig) {
    if (config) {
      for (const tool of config.tools) this.tools.set(tool.name, tool)
    }
  }

  async start(): Promise<void> { /* stub */ }
  async stop(): Promise<void> { /* stub */ }
  listTools(): MCPTool[] { return Array.from(this.tools.values()) }
  async callTool(name: string, input: Record<string, unknown>): Promise<unknown> {
    const tool = this.tools.get(name)
    return tool ? tool.handler(input) : undefined
  }
}

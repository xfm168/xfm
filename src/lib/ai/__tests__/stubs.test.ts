import { describe, it, expect } from 'vitest'
import { StubRAGRetriever } from '../RAGStub'
import type { IRAGRetriever } from '../RAGStub'
import { FunctionRegistry } from '../FunctionCallingStub'
import { StubMCPServer } from '../MCPStub'
import type { IMCPServer } from '../MCPStub'
import { StubAgent } from '../MultiAgentStub'
import type { IAgent } from '../MultiAgentStub'
import { InMemoryStore } from '../AIMemoryStub'

describe('StubRAGRetriever', () => {
  it('implements IRAGRetriever', () => {
    const rag: IRAGRetriever = new StubRAGRetriever()
    expect(rag).toBeDefined()
  })

  it('search returns empty', async () => {
    const rag = new StubRAGRetriever()
    const result = await rag.search({ query: 'test', topK: 5 })
    expect(result.documents).toEqual([])
    expect(result.scores).toEqual([])
  })

  it('index does not throw', async () => {
    const rag = new StubRAGRetriever()
    await rag.index([{ id: '1', content: 'hello', metadata: {} }])
  })

  it('delete does not throw', async () => {
    const rag = new StubRAGRetriever()
    await rag.delete(['1'])
  })
})

describe('FunctionRegistry', () => {
  it('register + call', async () => {
    const reg = new FunctionRegistry()
    reg.register({
      name: 'add',
      description: 'Add two numbers',
      parameters: {},
      handler: async (args: any) => args.a + args.b,
    })
    const result = await reg.call({ name: 'add', arguments: { a: 1, b: 2 } })
    expect(result.success).toBe(true)
    expect(result.data).toBe(3)
  })

  it('call unknown function', async () => {
    const reg = new FunctionRegistry()
    const result = await reg.call({ name: 'unknown', arguments: {} })
    expect(result.success).toBe(false)
    expect(result.error).toContain('not found')
  })

  it('call handler error', async () => {
    const reg = new FunctionRegistry()
    reg.register({
      name: 'fail',
      description: 'Always fails',
      parameters: {},
      handler: async () => { throw new Error('boom') },
    })
    const result = await reg.call({ name: 'fail', arguments: {} })
    expect(result.success).toBe(false)
  })

  it('unregister', () => {
    const reg = new FunctionRegistry()
    reg.register({ name: 'temp', description: '', parameters: {}, handler: async () => null })
    expect(reg.unregister('temp')).toBe(true)
    expect(reg.unregister('temp')).toBe(false)
  })

  it('has', () => {
    const reg = new FunctionRegistry()
    reg.register({ name: 'fn1', description: '', parameters: {}, handler: async () => null })
    expect(reg.has('fn1')).toBe(true)
    expect(reg.has('fn2')).toBe(false)
  })

  it('list', () => {
    const reg = new FunctionRegistry()
    reg.register({ name: 'a', description: '', parameters: {}, handler: async () => null })
    reg.register({ name: 'b', description: '', parameters: {}, handler: async () => null })
    expect(reg.list().length).toBe(2)
    expect(reg.size).toBe(2)
  })
})

describe('StubMCPServer', () => {
  it('implements IMCPServer', () => {
    const server: IMCPServer = new StubMCPServer()
    expect(server).toBeDefined()
  })

  it('start/stop does not throw', async () => {
    const server = new StubMCPServer()
    await server.start()
    await server.stop()
  })

  it('listTools empty', () => {
    const server = new StubMCPServer()
    expect(server.listTools()).toEqual([])
  })

  it('with tools', async () => {
    const server = new StubMCPServer({
      name: 'test', version: '1.0.0',
      tools: [{ name: 'echo', description: 'Echo', inputSchema: {}, handler: async (input: any) => input }],
    })
    expect(server.listTools().length).toBe(1)
    const result = await server.callTool('echo', { msg: 'hello' })
    expect(result).toEqual({ msg: 'hello' })
  })
})

describe('StubAgent', () => {
  it('implements IAgent', () => {
    const agent: IAgent = new StubAgent('bazi', 'expert')
    expect(agent).toBeDefined()
    expect(agent.name).toBe('bazi')
    expect(agent.role).toBe('expert')
  })

  it('execute returns input', async () => {
    const agent = new StubAgent('bazi', 'expert')
    const result = await agent.execute({ question: 'test' })
    expect(result.success).toBe(true)
    expect(result.data).toEqual({ question: 'test' })
    expect(result.latencyMs).toBe(0)
  })
})

describe('InMemoryStore', () => {
  it('save + get', async () => {
    const store = new InMemoryStore()
    await store.save({
      id: '1', type: 'conversation', content: 'hello',
      metadata: {}, createdAt: Date.now(), updatedAt: Date.now(),
    })
    const entry = await store.get('1')
    expect(entry).toBeDefined()
    expect(entry!.content).toBe('hello')
  })

  it('get undefined', async () => {
    const store = new InMemoryStore()
    expect(await store.get('missing')).toBeUndefined()
  })

  it('query', async () => {
    const store = new InMemoryStore()
    await store.save({ id: '1', type: 'conversation', userId: 'u1', content: 'c1', metadata: {}, createdAt: Date.now(), updatedAt: Date.now() })
    await store.save({ id: '2', type: 'session', userId: 'u1', content: 'c2', metadata: {}, createdAt: Date.now(), updatedAt: Date.now() })
    const results = await store.query({ userId: 'u1' })
    expect(results.length).toBe(2)
  })

  it('delete', async () => {
    const store = new InMemoryStore()
    await store.save({ id: '1', type: 'conversation', content: '', metadata: {}, createdAt: Date.now(), updatedAt: Date.now() })
    expect(await store.delete('1')).toBe(true)
    expect(await store.delete('1')).toBe(false)
  })

  it('clear', () => {
    const store = new InMemoryStore()
    store.clear()
    expect(store.size).toBe(0)
  })
})

/**
 * Core 接口定义
 * 各层实现这些接口，确保解耦
 */

import type { Result } from '../result'

// ─── Calculator 接口 ───

export interface ICalculator<TInput, TOutput> {
  calculate(input: TInput): TOutput
}

// ─── Analyzer 接口 ───

export interface IAnalyzer<TContext, TResult> {
  name: string
  version: string
  analyze(context: TContext): Result<TResult>
}

// ─── Pipeline 接口 ───

export interface IPipeline<TInput, TOutput> {
  name: string
  version: string
  run(input: TInput, options?: Record<string, unknown>): Promise<Result<TOutput>>
}

// ─── Rule Engine 接口 ───

export interface IRuleEngine {
  execute<TContext>(
    rules: unknown[],
    context: TContext,
    options?: Record<string, unknown>,
  ): unknown
}

// ─── Cache 接口（Sprint B 实现）───

export interface ICache<T = unknown> {
  get(key: string): Promise<T | null>
  set(key: string, value: T, ttl?: number): Promise<void>
  del(key: string): Promise<void>
  has(key: string): Promise<boolean>
}

// ─── Knowledge Engine 接口（Sprint B 实现）───

export interface IKnowledgeEngine {
  lookup(tags: string[]): Promise<unknown>
}

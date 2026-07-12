/**
 * QiEventBus — 事件总线
 *
 * 所有模块通过事件通信，不用互相 import
 * 事件类型：qi:changed / qi:merged / qi:removed / qi:split / snapshot:created / step:completed
 */

import type { QiEventType, QiEvent } from './types'

type QiEventHandler = (event: QiEvent) => void

export class QiEventBus {
  private handlers: Map<QiEventType, Set<QiEventHandler>> = new Map()

  on(type: QiEventType, handler: QiEventHandler): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }
    this.handlers.get(type)!.add(handler)
  }

  off(type: QiEventType, handler: QiEventHandler): void {
    this.handlers.get(type)?.delete(handler)
  }

  emit(event: QiEvent): void {
    const handlers = this.handlers.get(event.type)
    if (handlers) {
      for (const handler of handlers) {
        handler(event)
      }
    }
  }

  emitStepCompleted(step: string, version: number, data: any): void {
    this.emit({ type: 'step:completed', step, data, version })
  }

  emitSnapshotCreated(step: string, version: number, snapshotIndex: number): void {
    this.emit({ type: 'snapshot:created', step, data: { snapshotIndex }, version })
  }

  emitRollback(step: string, version: number): void {
    this.emit({ type: 'step:rollback', step, data: null, version })
  }
}

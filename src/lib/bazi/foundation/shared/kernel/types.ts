/**
 * XuanFeng Core OS - Kernel 功能抽象类型定义
 *
 * 本文件定义系统内核级别的通用功能抽象：
 * 1. Result<T, E> - Rust 风格的结果类型（成功/失败二选一）
 * 2. Option<T> - Rust 风格的可选值类型（有值/无值）
 * 3. Either<L, R> - 左值/右值二选一类
 * 4. Observable<T> - 简单可观察对象（发布订阅模式）
 * 5. Command<R> / Query<R> - CQRS 命令与查询接口
 * 6. Disposable - 可释放资源接口与 using 工具
 */

// ──────────────────────────────────────────────────────
// Result<T, E> - 结果类型
// ──────────────────────────────────────────────────────

/**
 * Ok 结果：表示操作成功，携带成功值
 */
export interface OkResult<T> {
  readonly _tag: 'ok'
  readonly value: T
  isOk(): this is OkResult<T>
  isErr(): this is ErrResult<never>
  map<U>(fn: (value: T) => U): OkResult<U>
  flatMap<U, E>(fn: (value: T) => Result<U, E>): Result<U, E>
  unwrap(): T
  unwrapOr(defaultValue: T): T
  onOk(fn: (value: T) => void): OkResult<T>
  onErr(fn: (error: never) => void): OkResult<T>
}

/**
 * Err 结果：表示操作失败，携带错误信息
 */
export interface ErrResult<E> {
  readonly _tag: 'err'
  readonly error: E
  isOk(): this is OkResult<never>
  isErr(): this is ErrResult<E>
  map<U>(fn: (value: never) => U): ErrResult<E>
  flatMap<U, F>(fn: (value: never) => Result<U, F>): ErrResult<E>
  unwrap(): never
  unwrapOr<T>(defaultValue: T): T
  onOk(fn: (value: never) => void): ErrResult<E>
  onErr(fn: (error: E) => void): ErrResult<E>
}

/**
 * Result 联合类型：操作结果要么成功（Ok）要么失败（Err）
 */
export type Result<T, E> = OkResult<T> | ErrResult<E>

/**
 * 创建一个成功的 Result
 */
export function Ok<T>(value: T): OkResult<T> {
  return {
    _tag: 'ok',
    value,
    isOk(): boolean {
      return true
    },
    isErr(): boolean {
      return false
    },
    map<U>(fn: (value: T) => U): OkResult<U> {
      return Ok(fn(this.value))
    },
    flatMap<U, E>(fn: (value: T) => Result<U, E>): Result<U, E> {
      return fn(this.value)
    },
    unwrap(): T {
      return this.value
    },
    unwrapOr(_defaultValue: T): T {
      return this.value
    },
    onOk(fn: (value: T) => void): OkResult<T> {
      fn(this.value)
      return this
    },
    onErr(_fn: (error: never) => void): OkResult<T> {
      return this
    },
  }
}

/**
 * 创建一个失败的 Result
 */
export function Err<E>(error: E): ErrResult<E> {
  return {
    _tag: 'err',
    error,
    isOk(): boolean {
      return false
    },
    isErr(): boolean {
      return true
    },
    map<U>(_fn: (value: never) => U): ErrResult<E> {
      return this as unknown as ErrResult<E>
    },
    flatMap<U, F>(_fn: (value: never) => Result<U, F>): ErrResult<E> {
      return this as unknown as ErrResult<E>
    },
    unwrap(): never {
      throw new Error(`Tried to unwrap Err result: ${String(this.error)}`)
    },
    unwrapOr<T>(defaultValue: T): T {
      return defaultValue
    },
    onOk(_fn: (value: never) => void): ErrResult<E> {
      return this
    },
    onErr(fn: (error: E) => void): ErrResult<E> {
      fn(this.error)
      return this
    },
  }
}

// ──────────────────────────────────────────────────────
// Option<T> - 可选值类型
// ──────────────────────────────────────────────────────

/**
 * Some：表示有值
 */
export interface SomeResult<T> {
  readonly _tag: 'some'
  readonly value: T
  isSome(): this is SomeResult<T>
  isNone(): this is NoneResult
  map<U>(fn: (value: T) => U): SomeResult<U>
  flatMap<U>(fn: (value: T) => Option<U>): Option<U>
  unwrap(): T
  unwrapOr(defaultValue: T): T
}

/**
 * None：表示无值
 */
export interface NoneResult {
  readonly _tag: 'none'
  isSome(): this is SomeResult<never>
  isNone(): this is NoneResult
  map<U>(fn: (value: never) => U): NoneResult
  flatMap<U>(fn: (value: never) => Option<U>): NoneResult
  unwrap(): never
  unwrapOr<T>(defaultValue: T): T
}

/**
 * Option 联合类型：值要么存在（Some）要么不存在（None）
 */
export type Option<T> = SomeResult<T> | NoneResult

/**
 * 创建一个有值的 Option
 */
export function Some<T>(value: T): SomeResult<T> {
  return {
    _tag: 'some',
    value,
    isSome(): boolean {
      return true
    },
    isNone(): boolean {
      return false
    },
    map<U>(fn: (value: T) => U): SomeResult<U> {
      return Some(fn(this.value))
    },
    flatMap<U>(fn: (value: T) => Option<U>): Option<U> {
      return fn(this.value)
    },
    unwrap(): T {
      return this.value
    },
    unwrapOr(_defaultValue: T): T {
      return this.value
    },
  }
}

/**
 * 表示无值的 Option 常量
 */
export const None: NoneResult = {
  _tag: 'none',
  isSome(): boolean {
    return false
  },
  isNone(): boolean {
    return true
  },
  map<U>(_fn: (value: never) => U): NoneResult {
    return this
  },
  flatMap<U>(_fn: (value: never) => Option<U>): NoneResult {
    return this
  },
  unwrap(): never {
    throw new Error('Tried to unwrap None value')
  },
  unwrapOr<T>(defaultValue: T): T {
    return defaultValue
  },
}

// ──────────────────────────────────────────────────────
// Either<L, R> - 左值/右值二选一类
// ──────────────────────────────────────────────────────

/**
 * Left 实例接口
 */
export interface LeftInstance<L> {
  readonly _tag: 'left'
  readonly value: L
  isLeft(): this is LeftInstance<L>
  isRight(): this is RightInstance<never>
  bimap<L2, R2>(fnL: (l: L) => L2, fnR: (r: never) => R2): LeftInstance<L2>
}

/**
 * Right 实例接口
 */
export interface RightInstance<R> {
  readonly _tag: 'right'
  readonly value: R
  isLeft(): this is LeftInstance<never>
  isRight(): this is RightInstance<R>
  bimap<L2, R2>(fnL: (l: never) => L2, fnR: (r: R) => R2): RightInstance<R2>
}

/**
 * Either 联合类型：左值或右值二选一
 */
export type Either<L, R> = LeftInstance<L> | RightInstance<R>

/**
 * 创建一个左值 Either
 */
export function Left<L>(value: L): LeftInstance<L> {
  return {
    _tag: 'left',
    value,
    isLeft(): boolean {
      return true
    },
    isRight(): boolean {
      return false
    },
    bimap<L2, R2>(fnL: (l: L) => L2, _fnR: (r: never) => R2): LeftInstance<L2> {
      return Left(fnL(this.value))
    },
  }
}

/**
 * 创建一个右值 Either
 */
export function Right<R>(value: R): RightInstance<R> {
  return {
    _tag: 'right',
    value,
    isLeft(): boolean {
      return false
    },
    isRight(): boolean {
      return true
    },
    bimap<L2, R2>(_fnL: (l: never) => L2, fnR: (r: R) => R2): RightInstance<R2> {
      return Right(fnR(this.value))
    },
  }
}

// ──────────────────────────────────────────────────────
// Observable<T> - 可观察对象（发布订阅模式）
// ──────────────────────────────────────────────────────

/**
 * 简单可观察对象：支持订阅和值推送
 * 订阅者可通过 unsubscribe 取消订阅
 */
export class Observable<T> {
  private _subscribers: Array<(value: T) => void> = []

  /**
   * 订阅值变化
   * @param observer 观察者回调函数
   * @returns 取消订阅函数
   */
  subscribe(observer: (value: T) => void): () => void {
    this._subscribers.push(observer)
    return () => {
      const index = this._subscribers.indexOf(observer)
      if (index !== -1) {
        this._subscribers.splice(index, 1)
      }
    }
  }

  /**
   * 向所有订阅者推送新值
   * @param value 要推送的值
   */
  next(value: T): void {
    for (const subscriber of this._subscribers) {
      subscriber(value)
    }
  }

  /**
   * 获取当前订阅者数量
   */
  get subscriberCount(): number {
    return this._subscribers.length
  }
}

// ──────────────────────────────────────────────────────
// Command / Query - CQRS 接口
// ──────────────────────────────────────────────────────

/**
 * 命令接口：表示会改变系统状态的操作
 * 支持 execute 执行，可选 undo 撤销
 */
export interface Command<R> {
  /** 命令类型标识 */
  readonly type: string
  /** 执行命令，返回执行结果 */
  execute(): Promise<Result<R, string>>
  /** 撤销命令（可选），返回撤销结果 */
  undo?(): Promise<Result<R, string>>
}

/**
 * 查询接口：表示只读操作，不改变系统状态
 */
export interface Query<R> {
  /** 查询类型标识 */
  readonly type: string
  /** 执行查询，返回查询结果 */
  execute(): Promise<Result<R, string>>
}

// ──────────────────────────────────────────────────────
// Disposable + using - 资源管理
// ──────────────────────────────────────────────────────

/**
 * 可释放资源接口
 * 实现此接口的对象拥有需要显式释放的资源
 */
export interface Disposable {
  /** 是否已释放 */
  readonly isDisposed: boolean
  /** 释放资源 */
  dispose(): void
}

/**
 * using 工具函数：确保资源在函数执行完毕后被释放
 * 即使函数抛出异常，dispose 也会被调用
 *
 * @param resource 要管理的可释放资源
 * @param fn 使用资源的函数
 */
export function using<T extends Disposable>(resource: T, fn: (t: T) => void): void {
  try {
    fn(resource)
  } finally {
    if (!resource.isDisposed) {
      resource.dispose()
    }
  }
}

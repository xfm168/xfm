// tracker.ts - 匿名分析追踪器
// RC3-10: 用户行为匿名分析系统
// 所有用户标识均经过 SHA256 匿名化处理, 仅保留前 8 位十六进制, 不可逆推原始用户 ID
// 数据存储在 localStorage, key: xuanfengmen_analytics

export interface AnalyticsEvent {
  type: string;
  page: string;
  action: string;
  duration?: number;
  metadata?: Record<string, unknown>;
  timestamp: string;
  sessionId: string;
  anonymizedUserId: string;
}

const STORAGE_KEY = 'xuanfengmen_analytics';
const SESSION_KEY = 'xuanfengmen_session_id';
const MAX_EVENTS = 500;

export class AnalyticsTracker {
  private events: AnalyticsEvent[];
  private sessionId: string;
  private anonymizedUserId: string;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId || 'anonymous';
    this.events = [];
    this.sessionId = '';
    this.anonymizedUserId = '';
    this.loadFromStorage();
    this.sessionId = this.generateSessionId();
    // 异步初始化匿名用户 ID (SHA256 前 8 位)
    this.initAnonymizedUserId();
  }

  // 异步初始化匿名用户 ID
  private async initAnonymizedUserId(): Promise<void> {
    this.anonymizedUserId = await this.hashUserId(this.userId);
    this.saveToStorage();
  }

  // SHA256 哈希, 取前 8 位十六进制字符
  private async hashUserId(userId: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(userId);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(function (b) {
        return b.toString(16).padStart(2, '0');
      }).join('');
      return hashHex.substring(0, 8);
    } catch (e) {
      // 降级: 同步简易哈希 (仅在 crypto.subtle 不可用时使用)
      return this.simpleHash(userId).substring(0, 8);
    }
  }

  // 同步简易哈希降级方案
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  // 生成会话 ID (同一浏览器标签页内复用)
  generateSessionId(): string {
    const stored = this.getStoredSessionId();
    if (stored) {
      return stored;
    }
    const id = Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 10);
    this.storeSessionId(id);
    return id;
  }

  private getStoredSessionId(): string | null {
    try {
      return localStorage.getItem(SESSION_KEY);
    } catch (e) {
      return null;
    }
  }

  private storeSessionId(id: string): void {
    try {
      localStorage.setItem(SESSION_KEY, id);
    } catch (e) {
      // localStorage 不可用时静默失败
    }
  }

  // 记录页面浏览
  trackPageView(page: string): void {
    this.trackEvent('page_view', page, 'view');
  }

  // 记录事件
  trackEvent(type: string, page: string, action: string, metadata?: Record<string, unknown>): void {
    const event: AnalyticsEvent = {
      type: type,
      page: page,
      action: action,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      anonymizedUserId: this.anonymizedUserId
    };
    if (metadata) {
      event.metadata = metadata;
    }
    this.events.push(event);
    this.saveToStorage();
  }

  // 记录分析次数和耗时
  trackAnalysis(type: string, duration: number): void {
    this.trackEvent('analysis', 'analysis', type, { duration: duration, analysisType: type });
  }

  // 记录转化
  trackConversion(from: string, to: string): void {
    this.trackEvent('conversion', from, 'convert_to_' + to, { from: from, to: to });
  }

  // 记录留存
  trackRetention(day: number, returned: boolean): void {
    this.trackEvent('retention', 'retention', 'day_' + day, { day: day, returned: returned });
  }

  // 记录跳出
  trackBounce(page: string, duration: number): void {
    this.trackEvent('bounce', page, 'bounce', { duration: duration });
  }

  // 记录会话
  trackSession(): void {
    this.trackEvent('session', 'session', 'start', { sessionId: this.sessionId });
  }

  // 获取统计汇总
  getStats(): Record<string, unknown> {
    const total = this.events.length;
    const pageViews = this.events.filter(function (e) { return e.type === 'page_view'; }).length;
    const analyses = this.events.filter(function (e) { return e.type === 'analysis'; }).length;
    const conversions = this.events.filter(function (e) { return e.type === 'conversion'; }).length;
    const bounces = this.events.filter(function (e) { return e.type === 'bounce'; }).length;
    const sessions = this.events.filter(function (e) { return e.type === 'session'; }).length;

    const analysisEvents = this.events.filter(function (e) { return e.type === 'analysis'; });
    const totalAnalysisDuration = analysisEvents.reduce(function (sum, e) {
      return sum + (e.duration || 0);
    }, 0);
    const avgAnalysisDuration = analyses > 0 ? totalAnalysisDuration / analyses : 0;

    const bounceRate = pageViews > 0 ? (bounces / pageViews) * 100 : 0;

    const uniquePages: Record<string, boolean> = {};
    this.events.forEach(function (e) { uniquePages[e.page] = true; });

    return {
      totalEvents: total,
      pageViews: pageViews,
      analyses: analyses,
      conversions: conversions,
      bounces: bounces,
      sessions: sessions,
      avgAnalysisDuration: Math.round(avgAnalysisDuration),
      bounceRate: Math.round(bounceRate * 100) / 100,
      uniquePages: Object.keys(uniquePages).length,
      sessionId: this.sessionId,
      anonymizedUserId: this.anonymizedUserId
    };
  }

  // 从 localStorage 加载数据
  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.events)) {
          this.events = parsed.events;
        }
        if (parsed && typeof parsed.anonymizedUserId === 'string' && parsed.anonymizedUserId) {
          this.anonymizedUserId = parsed.anonymizedUserId;
        }
      }
    } catch (e) {
      this.events = [];
    }
  }

  // 保存到 localStorage
  private saveToStorage(): void {
    try {
      const data = JSON.stringify({
        events: this.events.slice(-MAX_EVENTS),
        sessionId: this.sessionId,
        anonymizedUserId: this.anonymizedUserId,
        updatedAt: new Date().toISOString()
      });
      localStorage.setItem(STORAGE_KEY, data);
    } catch (e) {
      // 存储空间不足时静默处理
    }
  }

  // 清除所有分析数据
  clear(): void {
    this.events = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // 忽略
    }
  }

  // 导出所有事件 (用于上报)
  exportEvents(): AnalyticsEvent[] {
    return this.events.slice();
  }
}

// index.ts - 分析模块统一导出
// RC3-10: 匿名分析追踪系统
// 所有用户标识均经过 SHA256 匿名化处理, 不存储任何可识别个人信息

export { AnalyticsTracker } from './tracker';
export type { AnalyticsEvent } from './tracker';

export { HeatmapTracker } from './heatmap';
export type { HeatmapPoint } from './heatmap';

// 默认导出
export { AnalyticsTracker as default } from './tracker';

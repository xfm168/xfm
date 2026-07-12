// heatmap.ts - 热图追踪 Hook
// RC3-10: 用户点击热图分析
// 记录用户在页面上的点击坐标, 用于生成点击热图
// 数据存储在 localStorage, key: xuanfengmen_heatmap

export interface HeatmapPoint {
  x: number;
  y: number;
  page: string;
  timestamp: string;
  element: string;
}

const STORAGE_KEY = 'xuanfengmen_heatmap';
const MAX_POINTS = 2000;

export class HeatmapTracker {
  private points: HeatmapPoint[];

  constructor() {
    this.points = [];
    this.loadFromStorage();
  }

  // 记录点击位置
  track(x: number, y: number, page: string, element?: string): void {
    const point: HeatmapPoint = {
      x: x,
      y: y,
      page: page,
      timestamp: new Date().toISOString(),
      element: element || ''
    };
    this.points.push(point);
    this.saveToStorage();
  }

  // 获取热图数据 (可按页面过滤)
  getHeatmap(page?: string): HeatmapPoint[] {
    if (page) {
      return this.points.filter(function (p) { return p.page === page; });
    }
    return this.points.slice();
  }

  // 导出热图数据 (JSON 字符串)
  exportData(): string {
    return JSON.stringify({
      total: this.points.length,
      points: this.points,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  // 获取各页面点击统计
  getPageStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    this.points.forEach(function (p) {
      stats[p.page] = (stats[p.page] || 0) + 1;
    });
    return stats;
  }

  // 从 localStorage 加载
  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.points)) {
          this.points = parsed.points;
        }
      }
    } catch (e) {
      this.points = [];
    }
  }

  // 保存到 localStorage
  private saveToStorage(): void {
    try {
      const data = JSON.stringify({
        points: this.points.slice(-MAX_POINTS),
        updatedAt: new Date().toISOString()
      });
      localStorage.setItem(STORAGE_KEY, data);
    } catch (e) {
      // 存储空间不足时静默处理
    }
  }

  // 清除热图数据
  clear(): void {
    this.points = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // 忽略
    }
  }
}

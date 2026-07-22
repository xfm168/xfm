import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

/**
 * manualChunks 函数：将指定模块分配到独立分包
 * 使用函数形式以兼容 Vite/Rolldown 打包器
 */
const manualChunksFn: Record<string, string[]> = {
  // 命理静态数据独立分包（按需加载）
  'bazi-case-data': ['src/lib/bazi/qi/plugin/caseData.ts'],
  'bazi-knowledge': ['src/lib/bazi/qi/plugin/classicKnowledgeBase.ts'],
  'bazi-knowledge-graph': ['src/lib/bazi/qi/plugin/knowledgeGraph.ts'],
  // 规则引擎独立分包
  'bazi-rules': [
    'src/lib/bazi/rules/gejuRules.ts',
    'src/lib/bazi/rules/shishenRules.ts',
    'src/lib/bazi/rules/wuxingRules.ts',
    'src/lib/bazi/rules/xiyongRules.ts',
  ],
  // 五行八卦数据
  'hexagram': ['src/lib/hexagram.ts'],
  // 风水模块
  'fengshui': [
    'src/lib/fengshui/pipeline/index.ts',
    'src/lib/fengshui/knowledge/explainEngine.ts',
    'src/lib/fengshui/evidenceChain/index.ts',
  ],
  // 支付业务模块
  'payment': [
    'src/lib/business/payment.ts',
    'src/lib/business/refund.ts',
    'src/lib/business/order.ts',
  ],
  // 仪表盘与用户中心（v2 页面）
  'dashboard-v2': [
    'src/pages/Dashboard.tsx',
    'src/pages/UserCenter.tsx',
  ],
  // 认证模块
  'auth': [
    'src/hooks/useAuth.ts',
    'src/pages/Login.tsx',
  ],
  // 监控模块
  'monitoring': [
    'src/lib/monitoring/sentry.ts',
    'src/lib/monitoring/analytics.ts',
  ],
}

function manualChunks(id: string): string | undefined {
  for (const [chunkName, modules] of Object.entries(manualChunksFn)) {
    if (modules.some((m) => id.endsWith(m))) {
      return chunkName
    }
  }
  return undefined
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    cssMinify: false,
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
})

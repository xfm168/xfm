import { calculateBaZi } from './calculator'

const ITERATIONS = 10000

console.log(`\n=== P0-④ 四柱推算 Benchmark ===`)
console.log(`迭代次数: ${ITERATIONS}\n`)

const testCases = [
  { name: '基准日期', date: '1990-01-15', time: '08:30' },
  { name: '边界日期（立春）', date: '2024-02-04', time: '16:30' },
  { name: '边界日期（子时）', date: '2024-01-01', time: '23:30' },
  { name: '真太阳时校正', date: '2024-06-15', time: '08:58', options: { useSolarTime: true, longitude: 121.2 } },
]

for (const tc of testCases) {
  const start = performance.now()
  
  for (let i = 0; i < ITERATIONS; i++) {
    calculateBaZi({
      birthDate: tc.date,
      birthTime: tc.time,
      gender: 'male',
    }, tc.options)
  }
  
  const elapsed = performance.now() - start
  const opsPerSec = Math.round(ITERATIONS / (elapsed / 1000))
  
  console.log(`${tc.name}: ${elapsed.toFixed(2)}ms, ${opsPerSec.toLocaleString()} ops/s`)
}

console.log(`\n=== 稳定性测试 ===`)
const stabilityIterations = 100000
const stabilityStart = performance.now()

for (let i = 0; i < stabilityIterations; i++) {
  const offset = i % 365
  const d = new Date('2000-01-01')
  d.setDate(d.getDate() + offset)
  const dateStr = d.toISOString().split('T')[0]
  calculateBaZi({
    birthDate: dateStr,
    birthTime: `${(i % 24).toString().padStart(2, '0')}:${((i % 60) / 10).toFixed(1)}`,
    gender: 'male',
  })
}

const stabilityElapsed = performance.now() - stabilityStart
const stabilityOpsPerSec = Math.round(stabilityIterations / (stabilityElapsed / 1000))

console.log(`连续10万次排盘: ${stabilityElapsed.toFixed(2)}ms, ${stabilityOpsPerSec.toLocaleString()} ops/s`)
console.log(`内存使用: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`)

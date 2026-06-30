import fs from 'fs'

let content = fs.readFileSync('src/lib/bazi/rules/gejuRules.ts', 'utf8')

// 找出所有破格规则的priority范围
const pogePattern = /category: '破格',[\s\S]*?priority: (\d+)/g
let match
const priorities = []
while ((match = pogePattern.exec(content)) !== null) {
  priorities.push(parseInt(match[1]))
}
console.log('破格规则优先级分布：', priorities.sort((a, b) => a - b))

// 把所有破格规则的priority降到 80-95 之间
// 350/355 -> 95
// 340 -> 90
content = content.replace(
  /(category: '破格',\s*\n\s*)priority: 355/g,
  '$1priority: 95'
)
content = content.replace(
  /(category: '破格',\s*\n\s*)priority: 350/g,
  '$1priority: 92'
)
content = content.replace(
  /(category: '破格',\s*\n\s*)priority: 340/g,
  '$1priority: 88'
)

// 验证
const pogePattern2 = /category: '破格',[\s\S]*?priority: (\d+)/g
const priorities2 = []
while ((match = pogePattern2.exec(content)) !== null) {
  priorities2.push(parseInt(match[1]))
}
console.log('修改后破格规则优先级：', priorities2.sort((a, b) => a - b))

fs.writeFileSync('src/lib/bazi/rules/gejuRules.ts', content)
console.log('Done')

// Probe Intl chinese calendar parts
const dates: Array<[string, number, number, number, number]> = [
  ['2024-02-04 (立春前)', 2024, 2, 4, 4],
  ['2023-04-01 (闰二月)', 2023, 4, 1, 12],
  ['2020-05-23 (闰四月)', 2020, 5, 23, 12],
  ['2017-07-23 (闰六月)', 2017, 7, 23, 12],
  ['1976-09-25 (闰八月)', 1976, 9, 25, 12],
  ['1987-07-27 (闰六月)', 1987, 7, 27, 12],
  ['2001-05-23 (闰四月)', 2001, 5, 23, 12],
]

for (const [label, y, mo, d, h] of dates) {
  const dt = new Date(y, mo - 1, d, h)
  const fmt = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  const parts = fmt.formatToParts(dt)
  console.log(label)
  for (const p of parts) {
    console.log(`  ${p.type} = ${JSON.stringify(p.value)}`)
  }
  console.log('')
}

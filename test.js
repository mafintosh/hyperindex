const tape = require('tape')
const HyperIndex = require('./')
const ram = require('random-access-memory')

tape('a bunch of searches', function (t) {
  t.plan(4)

  const idx = new HyperIndex(ram, { valueEncoding: 'json' })

  const cnt = 100
  loop(0)

  function loop (i) {
    if (i === cnt) return test()
    const digits = i.toString().split('').filter(unique())
    idx.add({ i }, { keywords: digits }, () => loop(i + 1))
  }

  function test () {
    same(idx.lookup('0'), [0, 10, 20, 30, 40, 50, 60, 70, 80, 90])
    same(idx.lookup('1'), [1, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 31, 41, 51, 61, 71, 81, 91])
    same(HyperIndex.and(idx.lookup('0'), idx.lookup('1')), [10])
    same(HyperIndex.or(idx.lookup('0'), HyperIndex.and(idx.lookup('0'), idx.lookup('1'))), [0, 10, 20, 30, 40, 50, 60, 70, 80, 90])
  }

  function same (stream, expected, msg) {
    const list = []
    stream.on('data', data => list.push(data))
    stream.on('end', function () {
      t.same(list.sort((a, b) => a.i - b.i).map(({ i }) => i), expected, msg)
    })
  }
})

function unique () {
  const set = new Set()
  return function (n) {
    if (set.has(n)) return false
    set.add(n)
    return true
  }
}

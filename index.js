const hypertrie = require('hypertrie')
const mutexify = require('mutexify')
const stream = require('streamx')
const pump = require('pump')
const Union = require('sorted-union-stream')
const Intersect = require('sorted-intersect-stream')

const ORDER = Symbol('order')

class HyperIndex {
  constructor (storage, key, opts) {
    this.trie = hypertrie(storage, key, opts)
    this.lock = mutexify()
  }

  replicate (...args) {
    return this.trie.replicate(...args)
  }

  add (val, opts, cb) {
    const self = this

    this.lock(function (release) {
      self.trie.ready(function (err) {
        if (err) return release(cb, err)

        const id = opts.key || Math.max(1, self.trie.feed.length)
        const batch = [
          { key: 'values/' + id, value: val }
        ]

        for (const keyword of (opts.keywords || [])) {
          batch.push({
            key: 'index/' + keyword + '/' + id,
            value: '' + id
          })
        }

        self.trie.batch(batch, done)

        function done (err) {
          release(cb, err, id)
        }
      })
    })
  }

  remove (key, options, cb) {
    const self = this

    this.lock(function (release) {
      self.trie.ready(function (err) {
        if (err) return release(cb, err)

        const batch = [
          { type: 'del', key: 'values/' + id }
        ]

        for (const keyword of (opts.keywords || [])) {
          batch.push({
            type: 'del',
            key: 'index/' + keyword + '/' + id
          })
        }

        self.trie.batch(batch, release.bind(cb))
      })
    })
  }

  and (...words) {
    const streams = [...words].map(w => typeof w === 'string' ? this.lookup(w) : w)
    return HyperIndex.and(...streams)
  }

  or (...words) {
    const streams = [...words].map(w => typeof w === 'string' ? this.lookup(w) : w)
    return HyperIndex.or(...streams)
  }

  static and (...streams) {
    const s = [...streams]
    if (!s.length) return empty()
    return s.reduce((a, b) => new Intersect(a, b, cmp))
  }

  static or (...streams) {
    const s = [...streams]
    if (!s.length) return empty()
    return s.reduce((a, b) => new Union(a, b, cmp))
  }

  lookup (keyword) {
    const self = this

    return pump(
      this.trie.createReadStream('index/' + keyword),
      new stream.Transform({ transform })
    )

    function transform (data, cb) {
      const key = 'values/' + data.value.toString()
      const order = orderString(data)

      self.trie.get(key, function (err, node) {
        if (err || !node) return cb(err, null)
        node.value[ORDER] = order
        cb(null, node.value)
      })
    }
  }
}

module.exports = HyperIndex

function cmp (a, b) {
  return a[ORDER] < b[ORDER] ? -1 : a[ORDER] > b[ORDER] ? 1 : 0
}

function empty () {
  return new stream.Readable({
    read (cb) {
      this.push(null)
      cb(null)
    }
  })
}

function orderString (node) {
  let order = ''

  // strip hidden and two folders
  for (let i = 1 + 32 + 32; i < node.length; i++) {
    order += node.path(i)
  }

  order += node.key.split('/').pop()

  return order
}

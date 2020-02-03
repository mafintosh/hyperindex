# hyperindex

A keyword based search index built on [Hypertrie](https://github.com/mafintosh/hypertrie)

```
npm install hyperindex
```

## Usage

``` js
const Hyperindex = require('hyperindex')
const ram = require('random-access-memory')
const idx = new Hyperindex(ram, { valueEncoding: 'json' })

idx.add({
  some: 'data',
  you: 'want to index'
}, {
  keywords: ['good', 'data']
}, function () {
  console.log('object indexed to the trie ...')
})
```

To do lookups in the index use the lookup API:

``` js
const stream = idx.lookup('good')

stream.on('data', function (document) {
  console.log('document with keyword "good":', document)
})
```

## API

#### `index = new Hyperindex(storage, [key], [options])`

Create a new index. All arguments are forwarded to the Hypertrie instance.
To create an index from an existing Hypercore feed you can use the feed option

``` js
new Hyperindex(null, { feed: existingFeed })
```

If you're storing JSON documents, set `valueEncoding: 'json'` in the options as well.

#### `index.add(document, options, [callback])`

Add a document to the index. Options should include

```
{
  keywords: ['...'], // array of keywords to index this item at
  key: '...' // optionally set a unique key for this document
             // if not set one will be generated internally.
}
```

Callback is called with `callback(err, key)` where the key is the
identifier you need if you want to remove this document.

#### `index.remove(key, options, [callback])`

Removes a document from the index. `options` should contain the
same keywords as above.

#### `stream = index.lookup(keyword)`

Do a streaming lookup to get all the results for a given keyword.
The stream will contain the documents for that keyword and is hash-ordered.

#### `stream = index.and(...wordsOrStreams)`

Do a streaming intersect of multiple keywords.

#### `stream = index.or(...wordsOrStreams)`

Do a streaming union of multiple keywords.

#### `replicationStream = index.replicate(...args)`

Make a replication stream. Options forwarded to Hypertrie.

## License

MIT

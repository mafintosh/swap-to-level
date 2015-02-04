# swap-to-level

Key value store that holds datasets in memory until they reach a given size and then swaps them to leveldb

```
npm install swap-to-level
```

[![build status](http://img.shields.io/travis/mafintosh/swap-to-level.svg?style=flat)](http://travis-ci.org/mafintosh/swap-to-level)

## Usage

``` js
var swap = require('swap-to-level')
var store = swap(db, {max: 5}) // where db is a levelup

store.put('hello', 'world', function (err) {
  // will store 'world' in memory
})

... insert 4 more values ...

store.put('another', 'one', function (err) {
  // since we inserted 6 values ALL of the inserted data have
  // been swapped to being stored in leveldb instead of memory
})
```

## API

#### `store = swap(db, [options])`

Create a new memswap instance. Options include:

``` js
{
  max: 10, // Max keys stored before swapping. Defaults to Infinity
  valueEncoding: ... // Set a leveldb valueEncoding to use
}
```

#### `store.put(key, value, [cb])`

Insert a value in the store.

#### `store.get(key, cb)`

Get a value from the store. If the key does not exist an error is
returned with `err.notFound === true`

#### `store.del(key, [cb])`

Delete a value from the store.

#### `store.on('swap', fn)`

Emitted when the values are swapped from memory to leveldb.
Happens if the swap contains more than `max` values.

## License

MIT

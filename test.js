var tape = require('tape')
var memdb = require('memdb')
var memswap = require('./')

tape('swaps', function (t) {
  var db = memdb()
  var swap = memswap(db, {max: 1})
  var swapped = false

  swap.on('swap', function () {
    swapped = true
  })

  swap.put('hello', 'world', function (err) {
    if (err) throw err
    t.ok(!swapped, 'no swap yet')
    swap.get('hello', function (err, val) {
      if (err) throw err
      t.same(val, 'world', 'stored value')
      swap.put('hi', 'verden', function (err) {
        if (err) throw err
        t.ok(swapped, 'did swap')
        swap.get('hi', function (err, val) {
          if (err) throw err
          t.same(val, 'verden', 'stored value')
          swap.get('hello', function (err, val) {
            if (err) throw err
            t.same(val, 'world', 'still stored old value')
            t.end()
          })
        })
      })
    })
  })
})

tape('valueEncoding', function (t) {
  var db = memdb()
  var swap = memswap(db, {max: 0, valueEncoding: 'json'})

  swap.put('hello', {hello: 'world'}, function (err) {
    if (err) throw err
    swap.get('hello', function (err, val) {
      if (err) throw err
      t.same(val, {hello: 'world'}, 'valueEncoding works')
      t.end()
    })
  })
})

tape('not found', function (t) {
  var db = memdb()
  var swap = memswap(db)

  swap.get('hello', function (err) {
    t.same(err.message, 'Key not found in database [hello]')
    t.end()
  })
})

tape('delete lowers count', function (t) {
  var db = memdb()
  var swap = memswap(db, {max: 1})

  swap.on('swap', function () {
    t.ok(false, 'database swapped')
  })

  swap.put('hello', 'world', function () {
    swap.del('hello', function () {
      swap.put('hi', 'world', function () {
        t.ok(true, 'no swap')
        t.end()
      })
    })
  })
})

var memdb = require('memdb')
var swap = require('./')

var db = memdb()
var sw = swap(db, {max: 1})

sw.on('swap', function () {
  console.log('swapped data to leveldb')
})

sw.put('hello', 'world', function (err) {
  if (err) throw err
  sw.put('hi', 'verden', function (err) {
    if (err) throw err
    sw.get('hi', function (err, val) {
      if (err) throw err
      console.log('hi is %s', val)
    })
  })
})

var events = require('events')
var util = require('util')

var notFound = function (key) {
  var err = new Error('Key not found in database [' + key + ']')
  err.notFound = true
  return err
}

var Swap = function (db, opts) {
  if (!(this instanceof Swap)) return new Swap(db, opts)
  if (!opts) opts = {}

  events.EventEmitter.call(this)

  var max = typeof opts.max === 'number' ? opts.max : Infinity

  this.valueEncoding = opts.valueEncoding === 'utf8' ? 'utf-8' : opts.valueEncoding
  this.max = max
  this.used = 0
  this.cache = {}
  this.swapping = null
  this.db = db
}

util.inherits(Swap, events.EventEmitter)

Swap.prototype.del = function (key, cb) {
  if (!this.cache) return this.db.del(key, cb)
  if (this.swapping) return this.swapping.push([this.del, key, cb])

  if (this.cache[key]) this.used--
  delete this.cache[key]
  if (cb) cb(null)
}

Swap.prototype.get = function (key, cb) {
  if (!this.cache) return this.db.get(key, {valueEncoding: this.valueEncoding}, cb)
  if (this.swapping) return this.swapping.push([this.get, key, cb])

  var value = this.cache[key]
  if (value) cb(null, value)
  else cb(notFound(key))
}

Swap.prototype.put = function (key, value, cb) {
  if (!this.cache) return this.db.put(key, value, {valueEncoding: this.valueEncoding}, cb)
  if (this.swapping) return this.swapping.push([this.put, key, value, cb])

  if (this.valueEncoding === 'utf-8' && typeof value !== 'string') value = value.toString()
  else if (this.valueEncoding === 'binary' && !Buffer.isBuffer(value)) value = new Buffer(value)

  this.cache[key] = value
  this.used++

  if (this.used <= this.max) return cb && cb(null)
  this.swapping = []

  var self = this
  var keys = Object.keys(self.cache)
  var batch = new Array(self.cache.length)

  for (var i = 0; i < keys.length; i++) {
    batch[i] = {
      type: 'put',
      key: keys[i],
      value: self.cache[keys[i]],
      valueEncoding: self.valueEncoding
    }
  }

  this.db.batch(batch, function (err) {
    if (err) return cb(err)
    self.cache = null
    self.emit('swap')
    while (self.swapping.length) {
      var list = self.swapping.shift()
      list.shift().apply(self, list)
    }

    if (cb) cb(null)
  })
}

module.exports = Swap

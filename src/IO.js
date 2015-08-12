var R = require('ramda');
var Type = require('./Type');
var attachMethods = require('./internal/util').attachMethods


var IO = Type.product('fn');

IO.chain = R.curry(function(f, io) {
  return IO(function() {
    var applyArgs = R.apply(R.__, arguments);
    return f(io.unapply(applyArgs)).unapply(applyArgs);
  });
});

IO.map = R.curry(function(f, io) {
  return io.unapply(function(ioF) {
    return IO(R.compose(f, ioF));
  });
});

IO.ap = R.curry(function(ioF, ioX) {
  return IO.chain(IO.map(R.__, ioX), ioF);
});

IO.prototype.ap = function(x) {
  return IO.ap(this, x);
};

IO.runIO = function(io) {
  return io.unapply(R.apply(R.__, R.tail(arguments)));
};

IO.prototype.runIO = function() {
  return IO.runIO.apply(null, R.prepend(this, arguments));
};

IO.of = IO.prototype.of = R.compose(IO, R.always);

IO.toString = function(io) {
  return 'IO(' + io.unapply(R.toString) + ')';
};

module.exports = attachMethods(IO);

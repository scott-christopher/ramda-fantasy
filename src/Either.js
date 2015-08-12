var R = require('ramda');

var Type = require('./Type');
var attachMethods = require('./internal/util').attachMethods;


var Either = Type.sum({
  Left: ['value'],
  Right: ['value']
});

Either.map = R.curry(function(f, e) {
  return e.match({
    Left: R.always(e),
    Right: R.compose(Either.Right, f)
  });
});

Either.of = Either.prototype.of = Either.Right;

Either.chain = R.curry(function chain(f, e) {
  return e.match({
    Left: R.always(e),
    Right: f
  })
});

Either.ap = R.curry(function ap(eF, eX) {
  return eF.match({
    Left: R.always(eF),
    Right: R.map(R.__, eX)
  })
});

Either.prototype.ap = function(x) {
  return Either.ap(this, x);
}

Either.bimap = R.curry(function bimap(lF, rF, e) {
  return e.match({
    Left: R.compose(Either.Left, lF),
    Right: R.compose(Either.Right, rF)
  });
});

Either.prototype.bimap = function(lF, rF) {
  return Either.bimap(lF, rF, this);
};

Either.extend = R.curry(function(f, e) {
  return e.match({
    Left: R.always(e),
    Right: R.always(Either.Right(f(e)))
  });
});

Either.toString = function(e) {
  return e.match({
    Left: function(x) { return 'Either.Left(' + R.toString(x) + ')'; },
    Right: function(x) { return 'Either.Right(' + R.toString(x) + ')'; }
  });
};

Either.equals = R.curry(function(e1, e2) {
  return e1.match({
    Left: function(x) {
      return e2.match({ Left: R.equals(x), Right: R.F });
    },
    Right: function(x) {
      return e2.match({ Left: R.F, Right: R.equals(x) });
    }
  });
});

module.exports = attachMethods(Either);

var R = require('ramda');
var Type = require('./Type');
var attachMethods = require('./internal/util').attachMethods;


var Maybe = Type.sum({ Just: ['value'], Nothing: [] });

Maybe.of = Maybe.prototype.of = Maybe.Just;

Maybe.isJust = function isJust(x) {
  return x.match({ Just: R.T, Nothing: R.F });
}
Maybe.isNothing = R.complement(Maybe.isJust);

Maybe.maybe = R.curry(function maybe(nothingVal, justFn, m) {
  return m.match({
    Just: justFn,
    Nothing: R.always(nothingVal)
  });
});

Maybe.map = R.curry(function map(f, m) {
  return Maybe.maybe(m, R.compose(Maybe.Just, f), m);
});

Maybe.ap = R.curry(function ap(mF, mX) {
  return Maybe.maybe(mF, Maybe.map(R.__, mX), mF);
});

Maybe.prototype.ap = function ap(x) {
  return Maybe.ap(this, x);
}

Maybe.chain = R.curry(function chain(f, m) {
  return Maybe.maybe(m, f, m);
});

Maybe.equals = R.curry(function equals(m1, m2) {
  return Maybe.maybe(Maybe.isNothing(m2), function (val1) {
    return Maybe.maybe(false, R.equals(val1), m2);
  }, m1);
});

Maybe.getOrElse = R.curry(function getOrElse(orElse, m) {
  return Maybe.maybe(orElse, R.identity, m);
});

Maybe.reduce = R.curry(function reduce(f, init, m) {
  return Maybe.maybe(init, R.partial(f, init), m);
});

Maybe.from = R.ifElse(R.isNil, R.always(Maybe.Nothing), Maybe.Just);

Maybe.toString = function toString(m) {
  return Maybe.maybe('Maybe.Nothing', function(x) {
    return 'Maybe.Just(' + R.toString(x) + ')';
  }, m);
};

module.exports = attachMethods(Maybe);

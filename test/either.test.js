var assert = require('assert');
var equalsInvoker = require('./utils').equalsInvoker;
var types = require('./types')(equalsInvoker);

var Either = require('..').Either;

describe('Either', function() {
  var e = Either.Right(1);

  function mult(a) {
    return function(b) { return a * b; };
  }

  function add(a) {
    return function(b) { return a + b; };
  }

  it('is a Functor', function() {
    var fTest = types.functor;
    assert(fTest.iface(e));
    assert(fTest.id(e));
    assert(fTest.compose(e, mult(2), add(3)));
  });

  it('is an Apply', function() {
    var aTest = types.apply;
    var appA = Either.Right(mult(10));
    var appU = Either.Right(add(5));
    var appV = Either.Right(10);

    assert(aTest.iface(appA));
    assert(aTest.compose(appA, appU, appV));
  });

  it('is an Applicative', function() {
    var aTest = types.applicative;
    var app1 = Either.Right(101);
    var app2 = Either.Right(-123);
    var appF = Either.Right(mult(3));

    assert(aTest.iface(app1));
    assert(aTest.id(app1, app2));
    assert(aTest.homomorphic(app1, add(3), 46));
    assert(aTest.interchange(app1, appF, 17));
  });

  it('is a Chain', function() {
    var cTest = types.chain;
    var f1 = function(x) {return Either.Right(3 * x);};
    var f2 = function(x) {return Either.Right(5 + x);};

    assert(cTest.iface(e));
    assert(cTest.associative(e, f1, f2));
  });

  it('is a Monad', function() {
    var mTest = types.monad;
    assert(mTest.iface(e));
  });

  it('is an Extend', function() {
    var eTest = types.extend;
    var r = Either.Right(1);
    var l = Either.Left(1);
    var f = function(x) {return x + 1;};

    assert(eTest.iface(e));
    assert(eTest.iface(r.extend(f)));
    assert(eTest.iface(l.extend(f)));
  });

  describe('#bimap', function() {

    it('maps the first function over the left value', function() {
      var e = Either.Left(1);
      var result = e.bimap(add(1), add(-1));
      assert(result.equals(Either.Left(2)));
    });

    it('maps the second function over the right value', function() {
      var e = Either.Right(1);
      var result = e.bimap(add(-1), add(1));
      assert(result.equals(Either.Right(2)));
    });

  });

  describe('#toString', function() {

    it('returns the string representation of a Left', function() {
      assert.strictEqual(Either.Left('Cannot divide by zero').toString(),
                         'Either.Left("Cannot divide by zero")');
    });

    it('returns the string representation of a Right', function() {
      assert.strictEqual(Either.Right([1, 2, 3]).toString(),
                         'Either.Right([1, 2, 3])');
    });

  });

});

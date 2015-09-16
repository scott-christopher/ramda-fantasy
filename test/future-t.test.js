var R = require('ramda');
var assert = require('assert');
var equalsInvoker = require('./utils').equalsInvoker;
var types = require('./types')(function(f1, f2) {
  var success = function(x) { return [x, null]; };
  var failure = function(x) { return [null, x]; };
  var val1 = f1.fork(success, failure);
  var val2 = f2.fork(success, failure);
  return R.equals(val1, val2);
});

var Future = require('../src/FutureT');

describe('FutureT', function() {
  it('is a Functor', function() {
    var fTest = types.functor;
    var f = Future.of(2);
    assert.equal(true, fTest.iface(f));
    assert.equal(true, fTest.id(f));
    assert.equal(true, fTest.compose(f, R.multiply(2), R.add(3)));
  });

  it('is an Apply', function() {
    var aTest = types.apply;
    var appA = Future.of(R.multiply(10));
    var appU = Future.of(R.add(5));
    var appV = Future.of(10);
    assert.equal(true, aTest.iface(appA));
    assert.equal(true, aTest.compose(appA, appU, appV));
  });

  it('is an Applicative', function() {
    var aTest = types.applicative;
    var app1 = Future.of(101);
    var app2 = Future.of(-123);
    var appF = Future.of(R.multiply(3));

    assert.equal(true, aTest.iface(app1));
    assert.equal(true, aTest.id(app1, app2));
    assert.equal(true, aTest.homomorphic(app1, R.add(3), 46));
    assert.equal(true, aTest.interchange(app1, appF, 17));
  });

  it('is a Chain', function() {
    var cTest = types.chain;
    var f = Future.of(2);
    var f1 = function(x) {return Future.of((3 * x));};
    var f2 = function(x) {return Future.of((5 + x));};

    assert.equal(true, cTest.iface(f));
    assert.equal(true, cTest.associative(f, f1, f2));
  });

  it('is a Monad', function() {
    var mTest = types.monad;
    var f = Future.of(null);
    assert.equal(true, mTest.iface(f));
  });


  describe('reject', function() {

    it('creates a rejected future with the given value', function() {
      var f = Future.reject('foo');
      var forked = false;
      f.fork(function(err) {
        forked = true;
        assert.equal('foo', err);
      });
      assert.equal(true, forked);
    });

  });

  describe('#bimap', function() {

    it('maps the first function over the rejected value', function() {
      var f = Future.reject('err');
      var result = f.bimap(R.concat('map over '));
      result.fork(function(e) {
        assert.equal(e, 'map over err');
      });
    });

    it('maps the second function over the resolved value', function() {
      var f = Future.of(1);
      var result = f.bimap(null, R.add(1));
      result.fork(null, function(v) {
        assert.equal(v, 2);
      });
    });

  });

  describe('#toString', function() {

    it('returns the string representation of a Future', function() {
      assert.strictEqual(
        Future(function(reject, resolve) { void resolve; }).toString(),
        'Future(function (reject, resolve) { void resolve; })'
      );
    });

  });

  describe('#fork', function() {

    var result;
    var futureOne = Future.of(1);
    var throwError = function() {
      throw new Error('Some error message');
    };
    var setErrorResult = function(e) {
      result = e.message;
    };

    beforeEach(function() {
      result = null;
    });

    it('creates a rejected future if the resolve function throws an error', function() {
      futureOne.fork(setErrorResult, throwError);
      assert.equal('Some error message', result);
    });

    it('rejects the future if an error is thrown in a map function', function() {
      futureOne.map(throwError).fork(setErrorResult);
      assert.equal('Some error message', result);
    });

    it('rejects the future if an error is thrown in a chain function', function() {
      futureOne.chain(throwError).fork(setErrorResult);
      assert.equal('Some error message', result);
    });

    it('rejects the future if an error is thrown in a ap function', function() {
      Future.of(throwError).ap(futureOne).fork(setErrorResult);
      assert.equal('Some error message', result);
    });

  });

  describe('#memoize', function() {
    var memoized;
    var throwIfCalledTwice;

    beforeEach(function() {
      throwIfCalledTwice = (function() {
        var count = 0;
        return function(val) {
          if (++count > 1) {
            throw new Error('Was called twice');
          }
          return val;
        };
      }());
    });

    describe('resolve cases', function() {

      beforeEach(function() {
        memoized = Future.memoize(Future.of(1).map(throwIfCalledTwice));
      });

      it('can be forked with a resolved value', function(done) {
        memoized.fork(done, function(v) {
          assert.equal(1, v);
          done();
        });
      });

      it('passes on the same value to the memoized future', function(done) {
        memoized.fork(done, function() {
          memoized.fork(done, function(v) {
            assert.equal(1, v);
            done();
          });
        });
      });

    });

    describe('reject cases', function() {

      var throwError = function() {
        throw new Error('SomeError');
      };

      beforeEach(function() {
        memoized = Future.memoize(Future.of(1).map(throwIfCalledTwice).map(throwError));
      });

      it('can be forked with a rejected value', function() {
        var result;
        memoized.fork(function(err) {
          result = err.message;
        });
        assert.equal('SomeError', result);
      });

      it('does not call the underlying fork twice', function() {
        var result;
        memoized.fork(function(err1) {
          assert.equal('SomeError', err1.message);
          memoized.fork(function(err2) {
            result = err2.message;
          });
        });
        assert.equal('SomeError', result);
      });

    });

    describe('pending cases', function() {

      it('calls all fork resolve functions when the memoized future is resolved', function(done) {
        var delayed = new Future(function(reject, resolve) {
          setTimeout(resolve, 5, 'resolvedValue');
        });
        var memoized = Future.memoize(delayed.map(throwIfCalledTwice));
        var result1;
        var result2;
        function assertBoth() {
          if (result1 !== undefined && result2 !== undefined) {
            assert.equal('resolvedValue', result1);
            assert.equal('resolvedValue', result2);
            done();
          }
        }
        memoized.fork(done, function(v) {
          result1 = v;
          assertBoth();
        });
        memoized.fork(done, function(v) {
          result2 = v;
          assertBoth();
        });
      });

      it('calls all fork reject fnctions when the memoized future is rejected', function(done) {
        var delayed = new Future(function(reject) {
          setTimeout(reject, 5, 'rejectedValue');
        });
        var memoized = Future.memoize(delayed.bimap(throwIfCalledTwice, R.identity));
        var result1;
        var result2;
        function assertBoth() {
          if (result1 !== undefined && result2 !== undefined) {
            assert.equal('rejectedValue', result1);
            assert.equal('rejectedValue', result2);
            done();
          }
        }
        memoized.fork(function(e) {
          result1 = e;
          assertBoth();
        });
        memoized.fork(function(e) {
          result2 = e;
          assertBoth();
        });

      });

    });

  });

});


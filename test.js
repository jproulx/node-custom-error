var should = require('should');
var generateCustomError = require('./index');
var util = require('util');

var TestError       = generateCustomError('TestError');
var SubTestError    = generateCustomError('TestError',    {}, TestError);
var SubTypeError    = generateCustomError('SubTypeError', {}, TypeError);
var ValidationError = generateCustomError('ValidationError', { 'message' : 'Default Message', 'bar' : 'baz' }, TypeError);
ValidationError.prototype.foo = 'bar';

var errors = {
    'with new operator'          : new TestError('Message'),
    'without new operator'       : TestError('Message'),
    'with inherited constructor' : new SubTestError('Message')
};
describe('The custom error generator', function () {
    function create () {
        var args = Array.prototype.slice.call(arguments);
        return function () {
            return generateCustomError.apply(null, args);
        };
    }
    var error = new ValidationError('Missing field');
    it('should require a valid name parameter', function (done) {
        create().should.throw();
        create(null).should.throw();
        create(undefined).should.throw();
        create(400).should.not.throw();
        create('TestError').should.not.throw();
        return done();
    });
    it('should require inheritance from the Error prototype, if supplied', function (done) {
        create('Testing', {}, {}).should.throw();
        create('Testing', {}, TypeError).should.not.throw();
        create('Testing', {}, TestError).should.not.throw();
        return done();
    });
    it('should inherit from a parent Error, if supplied', function (done) {
        error.should.be.an.instanceOf(Error);
        error.should.be.an.instanceOf(TypeError);
        Error.prototype.isPrototypeOf(error).should.equal(true);
        TypeError.prototype.isPrototypeOf(error).should.equal(true);
        return done();
    });
    it('should retain properties passed in as a parameter', function (done) {
        error.should.have.property('bar');
        error.bar.should.equal('baz');
        return done();
    });
    it('should allow for prototype modification', function (done) {
        error.should.have.property('foo');
        error.foo.should.equal('bar');
        return done();
    });
    it('should allow for JSON serialization', function (done) {
        var serialized = error.toJSON();
        serialized.should.have.property('message');
        serialized.should.have.property('stack');
        return done();
    });
    it('should modify the stack trace when another Error is passed in', function (done) {
        var suberror = new SubTypeError('Encountered validation error', error);
        suberror.should.have.property('message');
        suberror.message.should.equal('Encountered validation error');
        suberror.should.have.property('stack');
        suberror.stack.should.containEql('SubTypeError: Encountered validation error');
        suberror.stack.should.containEql('ValidationError: Missing field');
        return done();
    });
    it('should attach object keys to itself when an object is passed in', function (done) {
        var suberror = new SubTypeError('Testing', {
            'q' : 's'
        });
        suberror.should.have.property('q');
        suberror.q.should.equal('s');
        return done();
    });
});
Object.keys(errors).forEach(function (name) {
    var error = errors[name];
    describe('Custom errors created ' + name, function () {
        it('should inherit from the Error prototype', function (done) {
            error.should.be.an.instanceOf(Error);
            Error.prototype.isPrototypeOf(error).should.equal(true);
            return done();
        });
        it('should inherit from the TestError prototype', function (done) {
            error.should.be.an.instanceOf(TestError);
            TestError.prototype.isPrototypeOf(error).should.equal(true);
            return done();
        });
        it('should identify as an Error object - [object Error]', function (done) {
            Object.prototype.toString.call(error).should.equal('[object Error]');
            return done();
        });
        it('should identify as an error to util#isError', function (done) {
            util.isError(error).should.equal(true);
            return done();
        });
        it('should override the default Error function name', function (done) {
            error.name.should.equal('TestError');
            error.toString().should.equal('TestError: Message');
            return done();
        });
        it('should have a stack trace that masks the module internals', function (done) {
            error.should.have.property('stack');
            error.stack.split('\n')[1].should.containEql('node-custom-error/test.js:');
            return done();
        });
    });
});

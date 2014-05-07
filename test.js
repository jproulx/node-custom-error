var should = require('should');
var generateCustomError = require('./index');
var util = require('util');
describe('Custom Errors', function () {
    var Constructor;
    var Constructor2;
    var Constructor3;
    var error;
    var error2;
    var error3;
    var error4;
    beforeEach(function () {
        Constructor  = generateCustomError('TestError');
        Constructor2 = generateCustomError('TestTypeError', { 'bar' : 'baz' }, TypeError);
        Constructor2.prototype.foo = 'bar';
        Constructor3 = generateCustomError('TestingTypeError', { 'q' : 's' }, Constructor2);
        error        = new Constructor('message');
        error2       = new Constructor2('message');
        error3       = new Constructor3(error2);
        error4       = new Constructor3(error3);
    });
    it('should inherit from the Error prototype', function (done) {
        error.should.be.an.instanceOf(Error);
        Error.prototype.isPrototypeOf(error).should.equal(true);
        return done();
    });
    it('should inherit from the Constructor prototype', function (done) {
        error.should.be.an.instanceOf(Constructor);
        Constructor.prototype.isPrototypeOf(error).should.equal(true);
        return done();
    });
    it('should return an error without the new operator', function (done) {
        var error = Constructor('message');
        error.should.be.an.instanceOf(Error);
        error.stack.split('\n')[1].should.containEql('/test.js:');
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
        error.toString().should.equal('TestError: message');
        return done();
    });
    it('should have a proper stack trace', function (done) {
        error.should.have.property('stack');
        error.stack.split('\n')[1].should.containEql('/test.js:');
        return done();
    });
    it('should retain properties passed to the generator', function (done) {
        error2.should.have.property('bar');
        error2.bar.should.equal('baz');
        return done();
    });
    it('should inherit from a parent Error, if specified', function (done) {
        error2.should.be.an.instanceOf(Error);
        error2.should.be.an.instanceOf(TypeError);
        error2.should.be.an.instanceOf(Constructor2);
        return done();
    });
    it('should allow for prototype modifications', function (done) {
        error2.should.have.property('foo');
        error2.foo.should.equal('bar');
        return done();
    });
    it('should validate arguments before creating errors', function (done) {
        function create () {
            var args = Array.prototype.slice.call(arguments);
            return function () {
                return generateCustomError.apply(null, args);
            };
        }
        create().should.throw();
        create('Testing', {}, {}).should.throw();
        return done();

    });
});

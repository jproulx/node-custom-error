node-custom-error
===================
[![Build Status](https://travis-ci.org/jproulx/node-custom-error.svg?branch=master)](https://travis-ci.org/jproulx/node-custom-error)

Custom errors and exceptions in Node.js, done right.

## Install

```bash
$ npm install custom-error-generator --save
```

## Usage

```javascript
var createCustomError = require('custom-error-generator');
var ValidationError = createCustomError('ValidationError', { 'required', 'Missing parameter x' }, TypeError);
var HTTPError = createCustomError('HTTPError', { 'code' : 500, 'status' : 'Server Error' });

throw new ValidationError('Required');
```

The generator function supports the following parameters:

* `name` {String} (required) - A custom name for this error type, which is printed when logging and in stack traces

* `data` {Object} (optional) - Additional properties to attach to the error, in key=value pairs or as object descriptors

* `parent` {Function} (optional) - A parent Error to subclass from. If supplied, is required to be a prototype of the built-in Error function

The errors created by the generated functions are identical to built-in Error objects, with additional features such as:

Custom properties can be attached and accessed at run time:
```javascript
var error = new HTTPError('Uh oh');
console.log(error.code, error.status); // prints 500 Server Error
```

Other errors can be passed in as arguments, which augment the available stack trace:
```javascript
var error = new ValidationError('Missing field');
var serverError = new HTTPError('Something went wrong', error);
console.log(serverError.stack);
```
outputs:
```bash
HTTPError: Something went wrong
    at Context.<anonymous> (/Projects/node-custom-error/test.js:19:24)
    at callFn (/Projects/node-custom-error/node_modules/mocha/lib/runnable.js:223:21)
    at Hook.Runnable.run (/Projects/node-custom-error/node_modules/mocha/lib/runnable.js:216:7)
    at next (/Projects/node-custom-error/node_modules/mocha/lib/runner.js:259:10)
    at Object._onImmediate (/Projects/node-custom-error/node_modules/mocha/lib/runner.js:276:5)
    at processImmediate [as _immediateCallback] (timers.js:330:15)
ValidationError: Missing field
    at Context.<anonymous> (/Projects/node-custom-error/test.js:18:24)
    at callFn (/Projects/node-custom-error/node_modules/mocha/lib/runnable.js:223:21)
    at Hook.Runnable.run (/Projects/node-custom-error/node_modules/mocha/lib/runnable.js:216:7)
    at next (/Projects/node-custom-error/node_modules/mocha/lib/runner.js:259:10)
    at Object._onImmediate (/Projects/node-custom-error/node_modules/mocha/lib/runner.js:276:5)
    at processImmediate [as _immediateCallback] (timers.js:330:15)
```

Errors can also be serialized into JSON format by using `error#toJSON();`. This will enumerate all of the hidden and custom properties, and also format the stack trace into an array of individual lines:

```javascript
console.log(error.toJSON()); // or console.log(JSON.stringify(error));
```
outputs
```bash
{ stack:
   [ 'ValidationError: Missing field',
     '    at Context.<anonymous> (/Projects/node-custom-error/test.js:17:24)',
     '    at callFn (/Projects/node-custom-error/node_modules/mocha/lib/runnable.js:223:21)',
     '    at Hook.Runnable.run (/Projects/node-custom-error/node_modules/mocha/lib/runnable.js:216:7)',
     '    at next (/Projects/node-custom-error/node_modules/mocha/lib/runner.js:259:10)',
     '    at Object._onImmediate (/Projects/node-custom-error/node_modules/mocha/lib/runner.js:276:5)',
     '    at processImmediate [as _immediateCallback] (timers.js:330:15)' ],
  arguments: undefined,
  type: undefined,
  required: 'Missing parameter x',
  message: 'Missing Field' }
```

## Notes
Care is taken to preserve the built-in error handling behavior as much as possible, supporting:

* `custom instanceOf Error`

* `Error.prototype.isPrototypeOf(custom)`

* `util.isError(custom)`

* `custom = generator('message')`

* `custom = new generator('message');`

In other words, you shouldn't have to worry about these errors affecting your syntax or existing code. Simply drop in place for any existing errors you're throwing and it should work just the same.

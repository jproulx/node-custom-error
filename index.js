/*jshint node: true */
"use strict";
var assert = require('assert');
module.exports = function createError (name, parameters, Parent) {
    // Custom errors require an explicit name.
    if (!name) {
        throw new TypeError('A custom error name is required');
    }
    var properties = {};
    // Set up the custom properties for this Error object, if specified.
    if (parameters) {
        Object.keys(parameters).forEach(function (property) {
            // If we were passed an object descriptor, preserve it
            if (typeof parameters[property] == 'object' && typeof parameters[property].enumerable !== 'undefined') {
                properties[property] = parameters[property];
            // Otherwise create an object descriptor based on the parameter
            } else {
                properties[property] = {
                    'value'        : parameters[property],
                    'enumerable'   : false,
                    'writable'     : true,
                    'configurable' : true
                };
            }
        });
        delete properties.message;
    }
    // If a parent is specified and is a valid Error constructor,
    // inherit from its prototype
    var source = Error;
    if (Parent) {
        if (typeof Parent != 'function' || !Error.prototype.isPrototypeOf(Parent.prototype)) {
            throw new TypeError('The parent should inherit from Error');
        }
        source = Parent;
    }
    // Create a new stack descriptor that includes the stacks for any errors
    // also passed in
    function createStackDescriptor (error, previous) {
        return function () {
            var stack = previous.get();
            error.forEach(function (err) {
                stack += '\n';
                stack += err.stack;
            });
            return stack;
        };
    }
    // The custom error function that's returned. Since it always creates a new
    // exception, we don't have to worry if itself was invoked with a new
    // operator or not.
    function CustomError () {
        var args   = Array.prototype.slice.call(arguments);
        var length = args.length;
        var proxy  = source.apply(null, args);
        // Capture the stack trace at the appropriate stack location
        Error.captureStackTrace(proxy, CustomError);
        // Make a backup of our existing stack descriptor
        var stackDescriptor = Object.getOwnPropertyDescriptor(proxy, 'stack');
        var sub = [];
        // Loop through the arguments and detect any errors that were passed in.
        // These are treated as sub errors and affect the stack
        while (length--) {
            var param = args[length];
            if (param instanceof Error) {
                sub.push(param);
            }
        }
        // If we have any errors that were passed in, replace the stack
        // descriptor that includes the other error stacks
        if (sub.length > 0) {
            properties.stack = {
                'get' : createStackDescriptor(sub, stackDescriptor)
            };
        }
        // Pass in our extra properties
        Object.defineProperties(proxy, properties);
        // Replace the error prototype with our own
        proxy.__proto__ = CustomError.prototype;
        return proxy;
    }
    // Copying from the Error prototype allows us to preserve the built-in error checks
    CustomError.prototype = Object.create(source.prototype, {
        // We don't want to replace our constructor
        'constructor' : {
            'value'        : CustomError,
            'writable'     : true,
            'configurable' : true
        },
        // Rename our constructor to the supplied name
        'name' : {
            'value'        : name,
            'enumerable'   : false,
            'writable'     : true,
            'configurable' : true
        },
        // Add an easy method of serializing this error into JSON format
        'toJSON' : {
            'value' : function () {
                var json =  {};
                Object.getOwnPropertyNames(this).forEach(function (name) {
                    json[name] = name == 'stack' ? this[name].split('\n') : this[name];
                }, this);
                return json;
            },
            'enumerable'   : false,
            'configurable' : false
        }
    });
    return CustomError;
};

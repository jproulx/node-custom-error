/*jshint node: true */
"use strict";
var util = require('util');
/**
 * Create a custom error generator
 *
 * @param   {String}    name        The error name
 * @param   {Object}    parameters  An optional set of key=value pairs to attach to errors
 * @param   {Function}  Parent      An optional parent Error class to inherit from
 * @param   {Function}  Constructor An optional constructor to inherit additional properties from
 * @return  {Function}
 */
module.exports = function createError (name, parameters, Parent, Constructor) {
    if (!name) {
        throw new TypeError('A custom error name is required');
    }
    if (Parent) {
        if (typeof Parent != 'function' || !Error.prototype.isPrototypeOf(Parent.prototype)) {
            throw new TypeError('The parent should inherit from Error.prototype');
        }
    }
    if (Constructor && typeof Constructor != 'function') {
        throw new TypeError('The constructor should be a function');
    }
    var properties = {};
    // Add object members to properties definition
    function addObjectToProperties (object) {
        Object.keys(object).forEach(function (property) {
            properties[property] = {
                'value'        : object[property],
                'enumerable'   : true,
                'writable'     : true,
                'configurable' : true
            };
        });
    }
    // Set up the custom properties for this Error object, if specified.
    if (parameters) {
        addObjectToProperties(parameters);
    }
    // If a parent is specified and is a valid Error constructor,
    // inherit from its prototype
    var source = Error;
    if (Parent) {
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
        var proxy  = source.apply(null, arguments);
        // Capture the stack trace at the appropriate stack location
        Error.captureStackTrace(proxy, CustomError);
        // Make a backup of our existing stack descriptor
        var stackDescriptor = Object.getOwnPropertyDescriptor(proxy, 'stack');
        var sub = [];
        var messages = [];
        // Loop through the arguments and detect any errors that were passed in.
        // These are treated as sub errors and affect the stack
        var length = arguments.length;
        var index  = length;
        while (index--) {
            var param = arguments[length - index - 1];
            if (param instanceof Error) {
                sub.push(param);
            } else if (typeof param == 'string' || typeof param == 'number') {
                messages.push(param);
            }
        }
        // If we have any errors that were passed in, replace the stack
        // descriptor that includes the other error stacks
        if (sub.length > 0) {
            properties.stack = {
                'get' : createStackDescriptor(sub, stackDescriptor)
            };
        }
        // Always set the message manually, in case there was a default supplied
        // format with util.format
        properties.message = {
            'value' : util.format.apply(null, messages)
        };
        // Pass in our extra properties
        Object.defineProperties(proxy, properties);
        // If we were given a constructor function, apply it here after we set our initial properties
        if (Constructor) {
            Constructor.apply(proxy, arguments);
        }
        // Replace the error prototype with our own
        proxy.__proto__ = CustomError.prototype;
        return proxy;
    }
    if (Constructor) {
        var props = {};
        Object.getOwnPropertyNames(Constructor.prototype).forEach(function (name) {
            props[name] = Object.getOwnPropertyDescriptor(Constructor.prototype, name);
            props[name].enumerable = false;
        });
        Constructor.prototype = Object.create(source.prototype, props);
    }
    // Copying from the Error prototype allows us to preserve the built-in error checks
    CustomError.prototype = Object.create(Constructor ? Constructor.prototype : source.prototype, {
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

/*jshint node: true */
"use strict";
var assert = require('assert');
module.exports = function createError (name, parameters, Parent) {
    // Custom errors require an explicit name.
    if (!name) {
        throw new TypeError('A custom error name is required');
    }
    var properties = {};
    /* 'name' : {
            'value'        : name,
            'enumerable'   : false,
            'writable'     : true,
            'configurable' : true
        }
    }; */
    // Set up the custom properties for this Error object, if specified.
    if (parameters) {
        Object.keys(parameters).forEach(function (property) {
            if (typeof parameters[property] == 'object' && typeof parameters[property].enumerable !== 'undefined') {
                properties[property] = parameters[property];
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
    function CustomError () {
        var args = Array.prototype.slice.call(arguments);
        var length = args.length;
        var proxy = source.apply(null, args);
        Error.captureStackTrace(proxy, CustomError);
        var stackDescriptor = Object.getOwnPropertyDescriptor(proxy, 'stack');
        var sub = [];
        while (length--) {
            var param = args[length];
            if (param instanceof Error) {
                sub.push(param);
            }
        }
        if (sub.length > 0) {
            properties.stack = {
                'get' : createStackDescriptor(sub, stackDescriptor)
            };

        }
        Object.defineProperties(proxy, properties);
        proxy.__proto__ = CustomError.prototype;
        return proxy;
    }
    CustomError.prototype = Object.create(source.prototype, {
        'constructor' : {
            'value'        : CustomError,
            'writable'     : true,
            'configurable' : true
        },
        'name' : {
            'value'        : name,
            'enumerable'   : false,
            'writable'     : true,
            'configurable' : true
        },
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

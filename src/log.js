"use strict";
var Path = require('path');
var Log = (function () {
    function Log() {
        this.level = Log.Level.DEBUG;
    }
    Log.prototype.debug = function (message, node) {
        this.log(Log.Level.DEBUG, message, node);
    };
    Log.prototype.info = function (message, node) {
        this.log(Log.Level.INFO, message, node);
    };
    Log.prototype.warn = function (message, node) {
        this.log(Log.Level.WARNING, message, node);
    };
    Log.prototype.error = function (message, node) {
        this.log(Log.Level.ERROR, message, node);
    };
    Log.prototype.log = function (level, message, node) {
        if (level >= this.level) {
            if (node) {
                var file = node.getSourceFile();
                var path = Path.relative('.', file.fileName);
                var pos = file.getLineAndCharacterOfPosition(node.pos);
                message = path + "(" + (pos.line + 1) + "," + (pos.character + 1) + "): " + message;
            }
            message = Log.Level[level] + ": " + message;
            console.log(message);
        }
    };
    return Log;
}());
var Log;
(function (Log) {
    (function (Level) {
        Level[Level["DEBUG"] = 0] = "DEBUG";
        Level[Level["INFO"] = 1] = "INFO";
        Level[Level["WARNING"] = 2] = "WARNING";
        Level[Level["ERROR"] = 3] = "ERROR";
    })(Log.Level || (Log.Level = {}));
    var Level = Log.Level;
})(Log || (Log = {}));
var log = new Log();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = log;
//# sourceMappingURL=log.js.map
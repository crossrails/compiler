"use strict";
const Path = require('path');
class Log {
    constructor() {
        this.level = Log.Level.WARNING;
    }
    setLevel(level) {
        let i = 0;
        for (let i = 0, l; l = Log.Level[i]; i++) {
            if (l == level.toUpperCase()) {
                this.level = i;
                return;
            }
        }
        this.warn(`Unknown log level '${level}', level remaining unchanged at ${Log.Level[this.level]}`);
    }
    debug(message, node) {
        this.log(Log.Level.DEBUG, message, node);
    }
    info(message, node) {
        this.log(Log.Level.INFO, message, node);
    }
    warn(message, node) {
        this.log(Log.Level.WARNING, message, node);
    }
    error(message, node) {
        this.log(Log.Level.ERROR, message, node);
    }
    log(level, message, node) {
        if (level >= this.level) {
            if (node) {
                let file = node.getSourceFile();
                let path = Path.relative('.', file.fileName);
                let pos = file.getLineAndCharacterOfPosition(node.pos);
                message = `${path}(${pos.line + 1},${pos.character + 1}): ${message}`;
            }
            message = `${Log.Level[level]}: ${message}`;
            console.log(message);
        }
    }
}
exports.Log = Log;
(function (Log) {
    (function (Level) {
        Level[Level["DEBUG"] = 0] = "DEBUG";
        Level[Level["INFO"] = 1] = "INFO";
        Level[Level["WARNING"] = 2] = "WARNING";
        Level[Level["ERROR"] = 3] = "ERROR";
    })(Log.Level || (Log.Level = {}));
    var Level = Log.Level;
})(Log = exports.Log || (exports.Log = {}));
exports.log = new Log();
//# sourceMappingURL=log.js.map
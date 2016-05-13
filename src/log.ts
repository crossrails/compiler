import * as ts from "typescript";
import * as Path from 'path';

class Log {
    public level: Log.Level = Log.Level.DEBUG;

    public debug(message: any, node?: ts.Node) {
        this.log(Log.Level.DEBUG, message, node);
    }
    
    public info(message: any, node?: ts.Node) {
        this.log(Log.Level.INFO, message, node);
    }
    
    public warn(message: any, node?: ts.Node) {
        this.log(Log.Level.WARNING, message, node);
    }
    
    public error(message: any, node?: ts.Node) {
        this.log(Log.Level.ERROR, message, node);
    }
    
    public log(level: Log.Level, message: any   , node?: ts.Node) {
        if(level >= this.level) {
            if(node) {
                let file = node.getSourceFile();
                let path = Path.relative('.', file.fileName);
                let pos = file.getLineAndCharacterOfPosition(node.pos);
                message = `${path}(${pos.line+1},${pos.character+1}): ${message}`;
            }
            message = `${Log.Level[level]}: ${message}`;
            console.log(message);    
        }
    }
}

namespace Log {
    export enum Level {
        DEBUG,
        INFO,
        WARNING,
        ERROR
    }
}

let log = new Log();

export default log;
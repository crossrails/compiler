import * as ts from "typescript";
import * as Path from 'path';

export class Log {
    private _warningCount = 0
    private _errorCount = 0

    public level: Log.Level = Log.Level.WARNING
    
    public setLevel(level: string) {
        let i = 0;
        for(let i = 0, l :string; l = Log.Level[i]; i++) {
            if(l == level.toUpperCase()) {
                this.level = i;
                return;
            }
        }
        this.warn(`Unknown log level '${level}', level remaining unchanged at ${Log.Level[this.level]}`);        
        this.info(`Supported log levels are 'debug', 'info', 'warning', 'error`);        
    }

    public resetCounters() {
        this._warningCount = 0;
        this._errorCount = 0;    
    }

    public get warningCount() {
        return this._warningCount;
    }

    public get errorCount() {
        return this._errorCount;
    }

    public debug(message: any, node?: ts.Node, line: number = 0) {
        this.log(Log.Level.DEBUG, message, node, line);
    }

    public info(message: any, node?: ts.Node, line: number = 0) {
        this.log(Log.Level.INFO, message, node, line);
    }
    
    public warn(message: any, node?: ts.Node, line: number = 0) {
        this.log(Log.Level.WARNING, message, node, line);
        this._warningCount++;
    }
    
    public error(message: any, node?: ts.Node, line: number = 0) {
        this.log(Log.Level.ERROR, message, node, line);
        this._errorCount++;
    }

    public logDiagnostics(diagnostics: ts.Diagnostic[]) {
        for(let diagnostic of diagnostics) {
            const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
            const node = diagnostic.file ? {pos: diagnostic.start, getSourceFile: () => diagnostic.file} : undefined; 
            switch(diagnostic.category) {
                case ts.DiagnosticCategory.Error:
                    this.error(message, node as ts.Node);
                    break;
                case ts.DiagnosticCategory.Warning:
                    this.warn(message, node as ts.Node);
                    break;
                case ts.DiagnosticCategory.Message:
                    this.info(message, node as ts.Node);
                    break;
            }
        }        
    }
    
    public log(level: Log.Level, message: any, node?: ts.Node, line: number = 0) {
        if(level >= this.level) {
            if(node) {
                let file = node.getSourceFile();
                let path = Path.relative('.', file.fileName);
                let pos = file.getLineAndCharacterOfPosition(node.pos);
                message = `${path}(${pos.line+line+1},${pos.character+1}): ${message}`;
            }
            message = `${Log.Level[level]}: ${message}`;
            switch(level) {
                case Log.Level.ERROR:
                    console.error(message);
                    break;
                case Log.Level.WARNING:
                    console.warn(message);
                    break;
                case Log.Level.INFO:
                    console.log(message);
                    break;
                case Log.Level.DEBUG:
                    console.log(message);
                    break;
            }    
        }
    }
}

export namespace Log {
    export enum Level {
        DEBUG,
        INFO,
        WARNING,
        ERROR
    }
}

export let log = new Log();

"use strict";
const nunjucks_1 = require('nunjucks');
class Emitter {
    constructor(module) {
        this.module = module;
        this.nunjucks = new nunjucks_1.Environment(this.loader, {
            autoescape: false,
            throwOnUndefined: true,
            tags: {
                blockStart: '<%',
                blockEnd: '%>',
                variableStart: '<$',
                variableEnd: '$>',
                commentStart: '<#',
                commentEnd: '#>'
            }
        });
        this.nunjucks.addFilter('indent', (text, direction) => {
            let indent = /^( *)\S/m.exec(text)[1].length;
            return text.replace(new RegExp(`^ {${indent}}`, 'gm'), "    ".repeat(indent / 4 + direction));
        });
        this.nunjucks.addFilter('array', (iterable) => {
            return Array.from(iterable);
        });
        this.nunjucks.addFilter('kind', (object) => {
            return object.constructor.name;
        });
        this.addFilters(this.nunjucks);
    }
    emit(options) {
        let defaults = {
            outDir: '.',
            newLine: 'crlf',
            noEmit: false,
            noEmitHelpers: false
        };
        this.writeFiles(this.module, this.nunjucks, Object.assign(defaults, this.defaultOptions, options));
    }
    get defaultOptions() { }
    get loader() { }
}
exports.Emitter = Emitter;
//# sourceMappingURL=emitter.js.map
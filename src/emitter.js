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
        this.writeFiles(this.module, this.nunjucks, options);
    }
    get loader() { }
}
Emitter.options = {
    'outDir': {
        group: 'General options:',
        desc: 'The directory to output the transpiled files to, omit to output beside original source files',
        type: 'string',
        default: '.'
    },
    'noEmit': {
        group: 'General options:',
        desc: 'Do not emit outputs',
        type: 'boolean',
        default: false
    },
    'noEmitWrapper': {
        group: 'General options:',
        desc: 'Do not include the wrapper for JS engine in compiled output',
        type: 'boolean',
        default: false
    }
};
exports.Emitter = Emitter;
//# sourceMappingURL=emitter.js.map
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
        let emittedOutput = false;
        for (let engine of this.engines) {
            if (options[engine]) {
                emittedOutput = true;
                this.writeFiles(this.module, this.nunjucks, engine, Object.assign({}, options, options[engine]));
            }
        }
        if (!emittedOutput) {
            this.writeFiles(this.module, this.nunjucks, this.engines[0], options);
        }
    }
    get engines() { }
    get loader() { }
}
Emitter.options = {
    'outDir': {
        group: 'General options:',
        desc: 'Redirect output structure to a directory',
        type: 'string',
        default: '.'
    },
    'noEmit': {
        group: 'General options:',
        desc: 'Do not emit complied output',
        type: 'boolean',
        default: false
    },
    'noEmitWrapper': {
        group: 'General options:',
        desc: 'Do not emit the wrapper for the specified JS engine in compiled output',
        type: 'boolean',
        default: false
    }
};
exports.Emitter = Emitter;
//# sourceMappingURL=emitter.js.map
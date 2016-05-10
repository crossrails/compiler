"use strict";
var emitter = {
    emitModule: function (node, out) {
        //copy in js.swift
        //create module_name.swift and add script loader
        //add extension JSProperty {}
        //define global this 
        out.emitChildren();
    },
    emitSourceFile: function (node, out) {
        //insert header comment
        out.emit(node.filename + ".swift", "import Foundation\n");
        out.emitChildren();
    },
    emitClass: function (node, out) {
    },
    emitMethod: function (node, out) {
    },
    emitVariable: function (node, out) {
        // = this[.name].infer()
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = emitter;
//# sourceMappingURL=javascriptcore.js.map
"use strict";
var Transpiler = (function () {
    function Transpiler(language, engine) {
        this.language = language;
        this.engine = engine;
        this.files = {};
    }
    Transpiler.prototype.transpile = function (module) {
        var _this = this;
        this.emitNode(module, this.language.emitModule, this.engine.emitModule, function () {
            var _loop_1 = function(file) {
                _this.emitNode(file, _this.language.emitSourceFile, _this.engine.emitSourceFile, function () {
                    for (var _i = 0, _a = file.declarations; _i < _a.length; _i++) {
                        var declaration = _a[_i];
                        declaration.accept(_this);
                    }
                });
            };
            for (var _i = 0, _a = module.files; _i < _a.length; _i++) {
                var file = _a[_i];
                _loop_1(file);
            }
        });
        for (var file in this.files) {
            console.log("FILE " + file + ":");
            console.log(this.files[file]);
        }
    };
    Transpiler.prototype.visitVariable = function (node) {
        this.emitNode(node, this.language.emitVariable, this.engine.emitVariable);
    };
    Transpiler.prototype.visitClass = function (node) {
        this.emitNode(node, this.language.emitClass, this.engine.emitClass);
    };
    Transpiler.prototype.visitMethod = function (node) {
        this.emitNode(node, this.language.emitMethod, this.engine.emitMethod);
    };
    Transpiler.prototype.emitNode = function (node, emitInterface, emitImplementation, emitChildren) {
        if (emitChildren === void 0) { emitChildren = function () { }; }
        var files = this.files;
        emitInterface(node, {
            emitChildren: function () {
                var emitter = this.emit;
                emitImplementation(node, {
                    emitChildren: emitChildren,
                    emit: emitter
                });
            },
            emit: function (file, output) {
                var contents = files[file];
                files[file] = contents == undefined ? output : contents + output;
            }
        });
    };
    return Transpiler;
}());
exports.Transpiler = Transpiler;
//# sourceMappingURL=transpiler.js.map
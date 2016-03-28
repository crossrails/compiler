var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Module = (function () {
    function Module() {
    }
    return Module;
}());
var SourceFile = (function () {
    function SourceFile() {
    }
    return SourceFile;
}());
var Declaration = (function () {
    function Declaration() {
    }
    return Declaration;
}());
var Class = (function (_super) {
    __extends(Class, _super);
    function Class() {
        _super.apply(this, arguments);
    }
    return Class;
}(Declaration));
var Method = (function (_super) {
    __extends(Method, _super);
    function Method() {
        _super.apply(this, arguments);
    }
    return Method;
}(Declaration));
//# sourceMappingURL=idl.js.map
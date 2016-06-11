import {JavaEmitter} from './java'
import {Options} from 'yargs';
import {Module, SourceFile, Type, AnyType, ArrayType, Declaration, VariableDeclaration, ClassDeclaration} from "../ast"

class NashornEmitter extends JavaEmitter {
    
    protected header(isGlobalClass: boolean): string {
        let lines: string[] = [];
        lines.push(`import jdk.nashorn.api.scripting.NashornException`);
        if(isGlobalClass) {
            lines.push(`static final ScriptObjectMirror global = JS.eval("../reference/src.js");\n`);
        }
        return lines.join('\n');        
    }    
}

export default new JavaEmitter(); 

declare module "../ast" {
    interface Declaration {
        mirror(): string
    }
    interface Type {
        arrayElementReturnValue(optional?: boolean): string;
        returnValue(declaration: VariableDeclaration): string;
        argumentValue(declaration: VariableDeclaration): string;
        arrayElementArgumentValue(optional?: boolean): string;
    }
}

ClassDeclaration.prototype.imports = function (this: ClassDeclaration, isGlobalType?: boolean) {
    let lines: string[] = [];
    lines.push(`import java.util.*;`);        
    lines.push(`import jdk.nashorn.api.scripting.*;`);
    if(!isGlobalType) {
        lines.push(`import static io.xrails.Src.global;`);
    }
    return lines.join('\n');
}

ClassDeclaration.prototype.header = function (this: ClassDeclaration, isGlobalType?: boolean) {
    let lines: string[] = [];
    if(isGlobalType) {
        lines.push(`    static final ScriptObjectMirror global = JS.eval("../reference/src.js");\n`);
    }       
    if(this.members.some((d: Declaration) => d.parent != d.sourceFile)) {
        lines.push(`    private static final ScriptObjectMirror classMirror = (ScriptObjectMirror)global.get("${this.name}");\n`);
    }       
    if(this.members.some((d: Declaration) => !d.static)) { 
        lines.push(`    private final ScriptObjectMirror mirror;`);
        lines.push(`    private final JSObject proxy;`);
    }
    return lines.join('\n');
}

ClassDeclaration.prototype.footer = function (this: ClassDeclaration, isGlobalType?: boolean) {
    return !this.members.some((d: Declaration) => !d.static) ? '' : `
    @Override
    public String toString() {
        return mirror.toString();
    }

    @Override
    public int hashCode() {
        return mirror.hashCode();
    }

    @Override
    public boolean equals(Object obj) {
        return proxy.equals(JS.heap.getOrDefault(obj, obj));
    }`;
}

Declaration.prototype.mirror = function (this: Declaration) {
    return this.parent == this.sourceFile ? 'global' : this.static ? 'classMirror' : 'mirror';        
}

VariableDeclaration.prototype.getter = function (this: VariableDeclaration) {
    let returnValue = this.type.optional ? `Optional.ofNullable(${this.type.returnValue(this)})` : this.type.returnValue(this);
    return `{
        return ${returnValue};
    }`;        
}

VariableDeclaration.prototype.setter = function (this: VariableDeclaration) {
    return `{
        global.setMember("${this.name}", ${this.type.argumentValue(this)});
    }`;        
}

AnyType.prototype.returnValue = function(this: AnyType, declaration: VariableDeclaration) {
    return `JS.wrap(${declaration.mirror()}.get("${declaration.name}"), JS.Object::new)`;    
}

ArrayType.prototype.returnValue = function(this: ArrayType, declaration: VariableDeclaration) {
    return `JS.wrap(${declaration.mirror()}.get("${declaration.name}"), ${this.typeArguments[0].arrayElementReturnValue()})`;    
}

Type.prototype.returnValue = function(this: Type, declaration: VariableDeclaration) {
    return `(${this.typeName()})${declaration.mirror()}.get("${declaration.name}")`    
}

ArrayType.prototype.arrayElementReturnValue = function(this: ArrayType, optional: boolean = this.optional) {
    return `o -> new JS.Array<>(o, ${this.typeArguments[0].arrayElementReturnValue()})`;    
}

Type.prototype.arrayElementReturnValue = function(this: Type, optional: boolean = this.optional) {
    return `JS.Array::new`;    
}

Type.prototype.argumentValue = function(this: Type, declaration: VariableDeclaration) {
    return `value`;    
}

ArrayType.prototype.argumentValue = function(this: ArrayType, declaration: VariableDeclaration) {
    return `JS.heap.computeIfAbsent(value, o -> new JS.ArrayMirror<>(${this.typeArguments[0].arrayElementArgumentValue(this.optional)}))`;    
}

Type.prototype.arrayElementArgumentValue = function(this: Type, optional: boolean = this.optional) {
    return `value`;    
}

ArrayType.prototype.arrayElementArgumentValue = function(this: ArrayType, optional: boolean = this.optional) {
    return `value, JS.ArrayMirror::new`;    
}

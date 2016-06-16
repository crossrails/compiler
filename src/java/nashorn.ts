import {emitter} from './java'
import {Module, SourceFile, Type, VoidType, AnyType, ArrayType, Declaration, VariableDeclaration, ClassDeclaration, InterfaceDeclaration, FunctionDeclaration, MemberDeclaration, DeclaredType, ParameterDeclaration, ConstructorDeclaration} from "../ast"

export default emitter;

declare module "../ast" {
    interface Declaration {
        accessor(): string
    }    
    interface MemberDeclaration {
        mirror(): string
    }
    interface Type {
        arrayElementReturnValue(optional?: boolean): string;
        returnValue(): string;
        argumentValue(): string;
        arrayElementArgumentValue(optional?: boolean): string;
    }
}

InterfaceDeclaration.prototype.imports = function (this: InterfaceDeclaration, isGlobalType?: boolean) {      
    return `import java.util.*;`
}

InterfaceDeclaration.prototype.header = function (this: InterfaceDeclaration, isGlobalType?: boolean) {
    return '';
}

InterfaceDeclaration.prototype.footer = function (this: InterfaceDeclaration, isGlobalType?: boolean) {
    return '';
}

ClassDeclaration.prototype.imports = function (this: ClassDeclaration, isGlobalType?: boolean) {
    return `
import java.util.*;
import java.util.function.*;
import jdk.nashorn.api.scripting.*;${
    isGlobalType ? '' : `\n
import static io.xrails.Src.global;`
    }`;
}

ClassDeclaration.prototype.header = function (this: ClassDeclaration, isGlobalType?: boolean) {
    return `
${!isGlobalType ? '' : `
    static final ScriptObjectMirror global = JS.eval("../reference/src.js");`.substr(1)
}${!this.members.some(m => m.parent != m.sourceFile) ? '' : `
    private static final ScriptObjectMirror classMirror = (ScriptObjectMirror)global.get("${this.name}");\n`.substr(1)
}${!this.members.some(m => !m.static) ? '' : `
    private final ScriptObjectMirror mirror;
    private final JSObject proxy;

    ${this.name}(ScriptObjectMirror mirror) { 
        this.mirror = mirror; 
        this.proxy = mirror; 
        JS.heap.put(this, proxy);
    }

`}`.substr(1);    
}

ClassDeclaration.prototype.footer = function (this: ClassDeclaration, isGlobalType?: boolean) {
    return !this.members.some(m => !m.static) ? '' : `
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

MemberDeclaration.prototype.mirror = function (this: MemberDeclaration) {
    return this.parent == this.sourceFile ? 'global' : this.static ? 'classMirror' : 'mirror';        
}

VariableDeclaration.prototype.accessor = function (this: VariableDeclaration) {
    return `${this.mirror()}.get("${this.name}")`
}

VariableDeclaration.prototype.getter = function (this: VariableDeclaration) {
    let returnValue = this.type.optional ? `Optional.ofNullable(${this.type.returnValue()})` : this.type.returnValue();
    return `{
        return ${returnValue};
    }`;        
}

VariableDeclaration.prototype.setter = function (this: VariableDeclaration) {
    return `{
        ${this.mirror()}.setMember("${this.name}", ${this.type.argumentValue()});
    }`;        
}

FunctionDeclaration.prototype.accessor = function (this: FunctionDeclaration): string {
    return `${this.mirror()}.callMember(${[`"${this.name}"`].concat(this.parameters.map(p => p.type.argumentValue())).join(', ')})`;
}

FunctionDeclaration.prototype.body = function (this: FunctionDeclaration): string {
    return `{
        ${this.returnType instanceof VoidType ? this.accessor() : `return ${this.returnType.returnValue()}`};
    }`;        
}

ConstructorDeclaration.prototype.body = function (this: ConstructorDeclaration): string {
    return `{
        mirror = (ScriptObjectMirror)classMirror.newObject(${this.parameters.map(p => p.type.argumentValue()).join(', ')}); 
        proxy = getClass() == ${this.parent.name}.class ? mirror : new JS.AbstractMirror(mirror) { 
            @Override 
            void build(BiConsumer<String, Function<Object[], Object>> builder) { 
${this.parent.members.filter(m => !m.static && m.constructor.name === 'FunctionDeclaration').map((m: FunctionDeclaration) => `
                builder.accept("${m.name}", args -> ${m.returnType instanceof VoidType ? 
                    `{ ${m.name}(${m.parameters.map((p, i) => `(${p.type.typeName()})args[${i}]`).join(', ')}); return null; }` : 
                    `${m.name}(${m.parameters.map((p, i) => `(${p.type.typeName()})args[${i}]`).join(', ')})`
                });`).join('').substr(1)} 
            } 
        }; 
        JS.heap.put(this, proxy); 
    }\n`;        
}

AnyType.prototype.returnValue = function(this: AnyType) {
    return `JS.wrap(${this.parent.accessor()}, JS.Object::new)`;    
}

DeclaredType.prototype.returnValue = function(this: DeclaredType) {
    return `JS.wrap(${this.parent.accessor()}, ${this.name}${this.declaration instanceof InterfaceDeclaration ? '.class' : '::new'})`;    
}

ArrayType.prototype.returnValue = function(this: ArrayType) {
    return `JS.wrap(${this.parent.accessor()}, ${this.typeArguments[0].arrayElementReturnValue()})`;    
}

Type.prototype.returnValue = function(this: Type) {
    return `(${this.typeName()})${this.parent.accessor()}`;    
}

ArrayType.prototype.arrayElementReturnValue = function(this: ArrayType, optional: boolean = this.optional) {
    return `o -> new JS.Array<>(o, ${this.typeArguments[0].arrayElementReturnValue()})`;    
}

Type.prototype.arrayElementReturnValue = function(this: Type, optional: boolean = this.optional) {
    return `JS.Array::new`;    
}

Type.prototype.argumentValue = function(this: Type) {
    return this.parent.name;    
}

DeclaredType.prototype.argumentValue = function(this: DeclaredType) {
    return this.declaration instanceof InterfaceDeclaration ? this.parent.name : `JS.heap.get(${this.parent.name})`;    
}

ArrayType.prototype.argumentValue = function(this: ArrayType) {
    return `JS.heap.computeIfAbsent(${this.parent.name}, o -> new JS.ArrayMirror<>(${this.typeArguments[0].arrayElementArgumentValue(this.optional)}))`;    
}

Type.prototype.arrayElementArgumentValue = function(this: Type, optional: boolean = this.optional) {
    return this.parent.name;    
}

ArrayType.prototype.arrayElementArgumentValue = function(this: ArrayType, optional: boolean = this.optional) {
    return `${this.parent.name}, JS.ArrayMirror::new`;    
}

import * as path from 'path';

export function adopt<Child extends { parent: any } | ReadonlyArray<{ parent: any }>>(child: Child, parent: any, propertyKey = 'parent'): Child {
    Array.isArray(child) ? child.forEach(element => adopt(element, parent, propertyKey)) :
        Object.defineProperty(child, propertyKey, {enumerable: false, writable: false, value: parent});
    return child;
}

export enum Flags {
    None = 0,
    Static = 1,
    Abstract = 2,
    Protected = 4,
    Constant = 8,
    Optional = 16,
    Thrown = 32
}


export abstract class Declaration {
    readonly name: string; 
    readonly flags: Flags;
    readonly comment: string
    readonly parent: Declaration;

    constructor(name: string | undefined, flags: Flags = Flags.None) {
        if(name) this.name = name;
        this.flags = flags;
    }

    get declaration(): Declaration {
        return this;
    }

    get module(): Module {
        return this.parent.module;
    }
    
    get sourceFile(): SourceFile {
        return this.parent.sourceFile;
    }

    get isStatic(): boolean {
        return (this.flags & Flags.Static) != 0;
    }

    get isAbstract(): boolean {
        return (this.flags & Flags.Abstract) != 0;
    }

    get isProtected(): boolean {
        return (this.flags & Flags.Protected) != 0;
    }

    protected abstract gatherImports(indices: Set<{index: number, default: string} | undefined>): void;
}

export class FunctionSignature {
    readonly parameters: ReadonlyArray<ParameterDeclaration>
    readonly returnType: Type;
    readonly thrownTypes: ReadonlyArray<Type>

    constructor(parameters: ReadonlyArray<ParameterDeclaration>, returnType: Type | undefined, thrownTypes: ReadonlyArray<Type>) {
        this.parameters = parameters;
        this.returnType = returnType || new VoidType();
        this.thrownTypes = thrownTypes;
    }
}

export class FunctionDeclaration extends Declaration {
    readonly signature: FunctionSignature
    readonly typeParameters: ReadonlyArray<Type>

    constructor(name: string | undefined, flags: Flags, signature: FunctionSignature, typeParameters: ReadonlyArray<Type>) {
        super(name, flags);
        this.signature = signature;
        this.typeParameters = adopt(typeParameters, this);
        adopt(signature.parameters, this);
        adopt(signature.returnType, this);
        adopt(signature.thrownTypes, this);
    }

    get parent(): NamespaceDeclaration {
        return super.parent as NamespaceDeclaration;
    }

    protected gatherImports(indices: Set<{index: number, default: string} | undefined>): void {
        this.signature.parameters.forEach(p => indices.add(p.type.requiredImport))
        indices.add(this.signature.returnType.requiredImport);
        this.signature.thrownTypes.forEach(t => indices.add(t.requiredImport))
        this.typeParameters.forEach(t => indices.add(t.requiredImport))
    }
    
}

export class ConstructorDeclaration extends FunctionDeclaration {
    constructor(flags: Flags, signature: FunctionSignature, typeParameters: ReadonlyArray<Type>) {
        super(undefined, flags, signature, typeParameters);
    }

    get name(): string {
        throw new Error('Accessing name of constructor')
    }
}

export class VariableDeclaration extends Declaration {
    readonly type: Type;
    
    constructor(name: string, flags: Flags, type: Type) {
        super(name, flags);
        this.type = adopt(type, this);
    }

    get isConstant(): boolean {
        return (this.flags & Flags.Constant) != 0;
    }

    get parent(): NamespaceDeclaration {
        return super.parent as NamespaceDeclaration;
    }

    protected gatherImports(indices: Set<{index: number, default: string} | undefined>): void {
        indices.add(this.type.requiredImport);
    }
}

export class ParameterDeclaration extends Declaration {
    readonly type: Type;
    
    constructor(name: string, flags: Flags, type: Type) {
        super(name, flags);
        this.type = adopt(type, this);
    }

    get isOptional(): boolean {
        return (this.flags & Flags.Optional) != 0;
    }

    get parent(): FunctionDeclaration {
        return super.parent as FunctionDeclaration;
    }

    protected gatherImports(indices: Set<{index: number, default: string} | undefined>): void {
        indices.add(this.type.requiredImport);
    }
}

export class NamespaceDeclaration extends Declaration {
    readonly declarations: ReadonlyArray<Declaration>
    
    constructor(name: string, flags: Flags, declarations: ReadonlyArray<Declaration>) {
        super(name, flags);
        this.declarations = adopt(declarations, this);
    }

    get parent(): NamespaceDeclaration {
        return super.parent as NamespaceDeclaration;
    }

    protected gatherImports(indices: Set<{index: number, default: string} | undefined>): void {
        this.declarations.forEach(d => (d as NamespaceDeclaration).gatherImports(indices));
    }
}

export class InterfaceDeclaration extends NamespaceDeclaration {
    readonly typeParameters: ReadonlyArray<Type>
    
    constructor(name: string, flags: Flags, declarations: ReadonlyArray<Declaration>, typeParameters: ReadonlyArray<Type>) {
        super(name, flags, declarations);
        this.typeParameters = adopt(typeParameters, this);
    }

    get parent(): NamespaceDeclaration {
        return super.parent as NamespaceDeclaration;
    }

    protected gatherImports(indices: Set<{index: number, default: string} | undefined>): void {
        super.gatherImports(indices);
        this.typeParameters.forEach(t => indices.add(t.requiredImport))
    }
}

export class ClassDeclaration extends NamespaceDeclaration {
    readonly superClass: string|undefined;
    readonly typeParameters: ReadonlyArray<Type>
    
    constructor(name: string, flags: Flags, declarations: ReadonlyArray<Declaration>, typeParameters: ReadonlyArray<Type>) {
        super(name, flags, declarations);
        this.typeParameters = adopt(typeParameters, this);
    }
    
    get isThrown(): boolean {
        return (this.flags & Flags.Thrown) != 0;
    }

    get parent(): NamespaceDeclaration {
        return super.parent as NamespaceDeclaration;
    }

    protected gatherImports(indices: Set<{index: number, default: string} | undefined>): void {
        super.gatherImports(indices);
        this.typeParameters.forEach(t => indices.add(t.requiredImport))
    }
}

export class SourceFile extends NamespaceDeclaration {
    readonly path: path.ParsedPath;    
    readonly module: Module;

    constructor(name: string, declarations: ReadonlyArray<Declaration>) {
        super(name, Flags.None, declarations);
        this.path = path.parse(name);
    }
        
    get sourceFile(): SourceFile {
        return this;
    }

    get requiredImports(): ReadonlyArray<{index: number, default: string}> {
        const indices = new Set<{index: number, default: string} | undefined>();
        this.gatherImports(indices);
        indices.delete(undefined);
        return [...indices] as ReadonlyArray<{index: number, default: string}>;
    }

}

export class Module {
    readonly sourceRoot: string;
    readonly files: ReadonlyArray<SourceFile>;
    
    constructor(sourceRoot: string, files: ReadonlyArray<SourceFile>) {
        this.sourceRoot = sourceRoot;
        this.files = adopt(files, this, 'module');
    }   

    *allDeclarations(): IterableIterator<Declaration> {
        function *traverse(child: Declaration & { declarations?: ReadonlyArray<Declaration>}): IterableIterator<Declaration> {
            yield child;
            if(child.declarations) for(const declaration of child.declarations) yield *traverse(declaration);
        }
        for(const file of this.files) yield *traverse(file);
    }
}

export abstract class Type {
    readonly flags: Flags
    readonly parent: Declaration|Type
    readonly requiredImport: {index: number, default: string} | undefined

    constructor(flags = Flags.None) {
        this.flags = flags;
    }

    get isOptional(): boolean {
        return (this.flags & Flags.Optional) != 0;
    }

    get declaration(): Declaration {
        return this.parent.declaration;
    }

}  

export class FunctionType extends Type {
    readonly signature: FunctionSignature
    
    constructor(flags: Flags, signature: FunctionSignature) {
        super(flags);
        this.signature = signature;
        adopt(signature.parameters, this);
        adopt(signature.returnType, this);
        adopt(signature.thrownTypes, this);
    }  
}       

export abstract class GenericType extends Type {
    readonly typeArguments: ReadonlyArray<Type>

    constructor(flags: Flags, typeArguments: ReadonlyArray<Type>) {
        super(flags);
        this.typeArguments = adopt(typeArguments, this);      
    }  
}

export class DeclaredType extends GenericType {
    readonly name: string
    readonly requiredImport: {index: number, default: string} | undefined

    constructor(name: string, flags: Flags, requiredImport: {index: number, default: string} | undefined, typeArguments: ReadonlyArray<Type>) {
        super(flags, typeArguments);
        this.name = name;
        this.requiredImport = requiredImport;
    }

    get isAbstract(): boolean {
        return (this.flags & Flags.Abstract) != 0;
    }

    get isThrown(): boolean {
        return (this.flags & Flags.Thrown) != 0;
    }
}

export class VoidType extends Type {
}

export class DateType extends Type { 
} 

export class ErrorType extends Type {
}

export class AnyType extends Type {
}

export class StringType extends Type {
}

export class NumberType extends Type {
}

export class BooleanType extends Type {
}

export class ArrayType extends GenericType {
}

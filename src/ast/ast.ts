export interface Declaration {
    readonly name: string,    
    readonly comment: string    
}

export interface Module extends Declaration {
    readonly src: string,
    readonly files: ReadonlyArray<SourceFile>
}

export interface SourceFile extends Declaration {
    readonly declarations: ReadonlyArray<Declaration>
}

export interface ClassDeclaration extends Declaration { 
    readonly superClass: string | undefined,
    readonly methods: ReadonlyArray<MethodDeclaration>
}

export interface MethodDeclaration extends Declaration {
    readonly abstract: boolean    
}

export interface VariableDeclaration extends Declaration {   
    readonly type: Type,
    readonly constant: boolean
    //public readonly initializer?: Expression;
}

export interface Type {
    readonly optional: boolean
}

export interface AnyType extends Type {
    
}

export interface StringType extends Type {
    
}

export interface NumberType extends Type {
    
}

export interface BooleanType extends Type {
    
}

export interface GenericType extends Type {
    readonly typeArguments: ReadonlyArray<Type>
}

export interface ArrayType extends GenericType {
    
}

export class Module {
    constructor(
        public /*readonly*/ name: string,
        public /*readonly*/ src: string,
        public /*readonly*/ files: ReadonlyArray<SourceFile>
    ) {}
}

export class Declaration {
    constructor(
        public /*readonly*/ name: string,    
        public /*readonly*/ comment: string    
    ) { }
}

export class SourceFile extends Declaration {
    constructor(
        name: string,    
        comment: string,    
        public /*readonly*/ declarations: ReadonlyArray<Declaration>
    ) { 
        super(name, comment);
    }
}

export class ClassDeclaration extends Declaration {
    constructor(
        name: string,    
        comment: string,    
        public /*readonly*/ superClass: string | undefined,
        public /*readonly*/ methods: ReadonlyArray<MethodDeclaration>
    ) { 
        super(name, comment);
    }
}

export class MethodDeclaration extends Declaration {
    constructor(
        name: string,    
        comment: string,    
        public /*readonly*/ abstract: boolean    
    ) { 
        super(name, comment);
    }
}


export class VariableDeclaration extends Declaration {
    constructor(
        name: string,    
        comment: string,    
        public /*readonly*/ type: Type,
        public /*readonly*/ constant: boolean
        //public /*readonly*/ initializer?: Expression;
    ) { 
        super(name, comment);
    }
}

export class Type {
    constructor(
        public /*readonly*/ optional: boolean
    ) { }
}

export class AnyType extends Type {
    
}

export class StringType extends Type {
    
}

export class NumberType extends Type {
    
}

export class BooleanType extends Type {
    
}

export class GenericType extends Type {
    constructor(
        /*readonly*/ optional: boolean,
        public /*readonly*/ typeArguments: ReadonlyArray<Type>
    ) { 
        super(optional)
    }
}

export class ArrayType extends GenericType {
    
}

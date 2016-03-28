class Module {
    name: string
    files: Array<SourceFile>
}

class SourceFile {
    name: string
    declarations: Array<Declaration>
}

class Declaration {
    name: string    
    abstract: boolean
}

class Class extends Declaration {
    superclass: string | undefined
    methods: Array<Method>
    
}

class Method extends Declaration {
    
}
interface Module {
    name: string
    src: string
    files: ReadonlyArray<SourceFile>
}

interface SourceFile {
    name: string
    declarations: ReadonlyArray<Declaration>
}

interface Declaration {
    name: string    
    abstract: boolean
}

interface Class extends Declaration {
    superClass: string | undefined
    methods: ReadonlyArray<Method>
    
}

interface Method extends Declaration {
    
}


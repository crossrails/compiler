declare module "doctrine" {
    export function parse<T>(comment: string, options?: Options): Comment;

    export interface Options {
        unwrap?: boolean
        tags?: string[]
        recoverable?: boolean
        sloppy?: boolean
        lineNumbers?: boolean
    }
    
    export interface Comment {
        description: string
        tags: Tag[]
        lineNumber?: number
    }

    export interface Tag {
        title: string
        description?: string
        type?: Type  
        name?: string
        [key: string]: any
        lineNumber?: number
    }

    export interface Type {
        type: string,
        name?: string
        fields: {
            type: string,
            key: string,
            value: {
                type: string,
                name: string
            }
            lineNumber?: number
        }[]
        [key: string]: any
        lineNumber?: number
    }
}

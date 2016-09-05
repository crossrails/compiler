import * as ts from "typescript";
import * as doctrine from 'doctrine';

namespace Comment {
    export type Tag = doctrine.Tag & {node: ts.Node, type: Tag.Type}
    export namespace Tag {
        export type Type = doctrine.Type & {node: ts.Node}
    }
}

export class Comment {
    private readonly tags: Map<string, Comment.Tag[]> = new Map();

    readonly description: string = '';

    static fromNode(node: ts.Node) {
        const text = node.getFullText();
        const comment = (ts.getLeadingCommentRanges(text, 0) || []).pop();
        return new Comment(comment ? text.substring(comment.pos, comment.end) : '');
    }

    static fromSymbol(symbol: ts.Symbol) {
        return new Comment(ts.displayPartsToString(symbol.getDocumentationComment()));
    }

    constructor(text: string) {
        const parsed = doctrine.parse(text, {unwrap : true, lineNumbers: true});
        this.description = parsed.description;
        for(const tag of parsed.tags) {
            // tag['node'] = node;
            // if(tag.type) {
            //     tag.type['node'] = node;
            // }
            this.tags.set(tag.title, [tag as Comment.Tag, ...(this.tags.get(tag.title) || [])]);
        }
    }

    isTagged(title: string, value?: string): boolean {
        const tags = this.tags.get(title);
        return tags != undefined && (!value || tags.some(tag => tag[title] == value));
    }

    tagsNamed(title: string): Comment.Tag[] {
        return this.tags.get(title) || [];
    }
}


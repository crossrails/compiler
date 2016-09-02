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

    constructor(node: ts.Node) {
        let text = node.getFullText();
        let comment = (ts.getLeadingCommentRanges(text, 0) || []).pop();
        if(comment) {
            let parsed = doctrine.parse(text.substring(comment.pos, comment.end), {unwrap : true, lineNumbers: true});
            this.description = parsed.description;
            for(let tag of parsed.tags) {
                tag['node'] = node;
                if(tag.type) {
                    tag.type['node'] = node;
                }
                this.tags.set(tag.title, [tag as Comment.Tag, ...(this.tags.get(tag.title) || [])]);
            }
        }
    }

    isTagged(title: string, value?: string): boolean {
        let tags = this.tags.get(title);
        return tags != undefined && (!value || tags.some(tag => tag[title] == value));
    }

    tagsNamed(title: string): Comment.Tag[] {
        return this.tags.get(title) || [];
    }
}


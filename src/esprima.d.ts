declare namespace ESTree {
  interface Comment extends Node {
    value: string;
  }
  
  interface Node {
    leadingComments?: Array<Comment>;
    trailingComments?: Array<Comment>;
  }
  
  interface Program {
      errors: Array<any>;
      comments: Array<Comment>
  }
}

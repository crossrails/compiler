declare namespace ESTree {
  interface Comment extends Node {
    value: string;
  }
  
  interface Node {
    leadingComments?: Comment[];
    trailingComments?: Comment[];
  }
  
  interface Program {
      errors: any[];
      comments?: Comment[];
  }
}

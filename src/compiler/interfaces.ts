export interface Buffer {
    write(...strs:string[]): void;
}

export interface Context extends Buffer {
    loopCount: number;
    source: string;
    index: number;
    nest(rule:Rule, subSource?:string, callback?:(ctx:Context) => void): void;
    raiseError(message:string): void;
}

export interface Rule {
    enter?: (ctx:Context) => void;
    leave?: (ctx:Context) => void;

    pattern?: RegExp;
    found?: (ctx:Context, matched:RegExpExecArray, skipped:string) => void;
    notfound?: (ctx:Context, extra:string) => void;
}

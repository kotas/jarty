export interface Buffer {
    write: (...strs: string[]) => void;
}

export interface Rule {
    name: string;
    search?: RegExp;
    enter?: (out: Buffer) => void;
    leave?: (out: Buffer) => void;
    skipped?: (out: Buffer, skipped: string) => void;
    found?: (out: Buffer, matched: string[]) => void;
    notfound?: (out: Buffer, extra: string) => void;
}

class Context {
    originalSource: string;
    index: number = 0;
    stash: Object = {};
    matched: string[];

    constructor(public source: string, public rule: Rule) {
        this.originalSource = this.source;
    }
}

class Stack {
    stack: Context[] = [];

    public pushNewContext(source: string, rule: Rule): Context {
        var context = new Context(source, rule);
        this.stack.push(context);
        return context;
    }
}

export class Compiler {

    constructor(private rules: Rule[]) { }

    public compileToString(source: string): string {
        var script: string = "";
        var buffer: Buffer = {
            write: (...strs: string[]) => {
                for (var i = 0; i < strs.length; i++) {
                    script += strs[i];
                }
            }
        };
        return "abc";
    }

    public compileToFunction(source: string): Function {
        var script = this.compileToString(source);
        try {
            return new Function("c", script);
        } catch (e) {
            throw new SyntaxError("Jarty compile error: " + (e.message || e) + "\n" +
                (script.length > 60 ? script.substr(0, 60) + "..." : script));
        }
    }

}

export class Parser {

    constructor(private buffer: Buffer, private rules: Rule[]) { }

    public run(source: string): void {
        if (!this.buffer) {
            throw new TypeError("invalid buffer");
        }
        if (!this.rules || !this.rules.length) {
            throw new TypeError("invalid rule");
        }
    }

}

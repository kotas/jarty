export interface Buffer {
    write(...strs: string[]): void;
}

export interface Context extends Buffer {
    loopCount: number;
    nest(rule: Rule, subSource?: string, callback?: (ctx: Context) => void): void;
    raiseError(message: string): void;
}

export interface Rule {
    enter?: (ctx: Context) => void;
    leave?: (ctx: Context) => void;

    pattern?: RegExp;
    found?: (ctx: Context, matched: string[], skipped: string) => void;
    notfound?: (ctx: Context, extra: string) => void;
}


export class Compiler {

    private rule: Rule;

    constructor(rule?: Rule) {
        this.rule = rule || Rules.start;
    }

    compileToString(source: string): string {
        var script: string = "";
        var buffer: Buffer = {
            write: (...strs: string[]) => {
                for (var i = 0; i < strs.length; i++) {
                    script += strs[i];
                }
            }
        };
        var parser = new Translator(buffer, this.rule);
        parser.run(source);
        return script;
    }

    compileToFunction(source: string): Function {
        var script = this.compileToString(source);
        try {
            return new Function("_", script);
        } catch (e) {
            throw new SyntaxError("Jarty compile error: " + (e.message || e) + "\n" +
                (script.length > 60 ? script.substr(0, 60) + "..." : script));
        }
    }

}


export class Translator {

    private scope: Scope;

    constructor(public buffer: Buffer, public rootRule: Rule) { }

    run(source: string): void {
        this.scope = new Scope(this, this.rootRule, source);
        try {
            while (this.next()) { }
        } finally {
            this.scope = null;
        }
    }

    next(): bool {
        var scope = this.scope, source = scope.source, rule = scope.rule;
        if (!rule.search) {
            return this.popScope();
        }

        while (scope === this.scope && source.length > 0) {
            var matched = source.match(rule.search);
            if (matched) {
                var skipped = source.slice(0, matched.index);
                rule.found && rule.found(scope, matched, skipped);
                scope.source = source = source.slice(matched.index + matched[0].length);
            } else {
                rule.notfound && rule.notfound(scope, source);
                scope.source = source = '';
            }
            scope.loopCount++;
        }
        if (scope === this.scope && source.length == 0) {
            return this.popScope();
        }

        return true;
    }

    popScope(): bool {
        this.scope.leave();
        if (this.scope.parent) {
            this.scope = this.scope.parent;
            this.scope.resume();
            return true;
        } else {
            this.scope = null;
            return false;
        }
    }

    pushScope(scope: Scope): void {
        scope.parent = this.scope;
        this.scope = scope;
        this.scope.enter();
    }

}


class Scope implements Context {

    loopCount: number = 0;
    parent: Scope;

    private resumeCallback: (ctx: Context) => void;

    constructor(public translator: Translator, public rule: Rule, public source: string) { }

    write(...strs: string[]): void {
        this.translator.buffer.write.apply(this.translator.buffer, strs);
    }

    nest(rule: Rule, subSource?: string, callback?: (ctx: Context) => void): void {
        var scope = new Scope(this.translator, rule, subSource);
        this.resumeCallback = callback;
        this.translator.pushScope(scope);
    }

    raiseError(message: string): void {

    }

    enter(): void {
        this.rule.enter && this.rule.enter(this);
    }

    leave(): void {
        this.rule.leave && this.rule.leave(this);
    }

    resume(): void {
        if (this.resumeCallback) {
            this.resumeCallback(this);
            this.resumeCallback = undefined;
        }
    }

}

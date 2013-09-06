/// <reference path="./interfaces.ts" />
/// <reference path="../exceptions.ts" />

interface Scope extends Context {
    enter(): void;
    leave(): void;
    resume(): void;
}

class ScopeStack<T extends Scope> {

    top:T;
    stack:Array<T> = [];

    pushScope(scope:T):void {
        this.top = scope;
        this.stack.push(scope);
        this.top.enter();
    }

    popScope():boolean {
        if (!this.top) {
            return false;
        }

        this.top.leave();
        this.stack.pop();

        if (this.stack.length > 0) {
            this.top = this.stack[this.stack.length - 1];
            this.top.resume();
            return true;
        } else {
            this.top = null;
            return false;
        }
    }

}

class TranslatorScope implements Scope {

    loopCount:number = 0;
    index:number = 0;
    remainSource:string;

    private resumeCallback:(ctx:Context) => void;

    constructor(public stack:ScopeStack<TranslatorScope>, public buffer:Buffer, public rule:Rule, public source:string) {
        this.remainSource = source;
    }

    write(...strs:string[]):void {
        this.buffer.write.apply(this.buffer, strs);
    }

    nest(rule:Rule, subSource?:string, callback?:(ctx:Context) => void):void {
        if (subSource === undefined) {
            subSource = this.remainSource;
        }
        var scope = new TranslatorScope(this.stack, this.buffer, rule, subSource);
        this.resumeCallback = callback;
        this.stack.pushScope(scope);
    }

    raiseError(message:string):void {
        throw new SyntaxError("Jarty parse error: " + message, this.stack.top.toErrorPosition());
    }

    toErrorPosition():ErrorPosition {
        var start = this.source.lastIndexOf("\n", this.index) + 1;
        var end = this.source.indexOf("\n", this.index);
        var breaks = this.source.substr(0, start).match(/\n/g);
        return {
            col: this.index - start,
            row: breaks ? breaks.length : 1,
            line: this.source.substring(start, end === -1 ? this.source.length : end),
            source: this.source
        };
    }

    enter():void {
        this.rule.enter && this.rule.enter(this);
    }

    leave():void {
        this.rule.leave && this.rule.leave(this);
    }

    resume():void {
        if (this.resumeCallback) {
            this.resumeCallback(this);
            this.resumeCallback = undefined;
        }
    }

}

export class Translator {

    private stack:ScopeStack<TranslatorScope>;

    constructor(public buffer:Buffer, public rootRule:Rule) {
    }

    run(source:string):void {
        this.stack = new ScopeStack<TranslatorScope>();
        this.stack.pushScope(new TranslatorScope(this.stack, this.buffer, this.rootRule, source));
        try {
            while (this.next()) {
            }
        } finally {
            this.stack = null;
        }
    }

    private next():boolean {
        var stack = this.stack,
            scope = stack.top,
            source = scope.remainSource,
            rule = scope.rule;

        if (!rule.pattern) {
            return this.stack.popScope();
        }

        while (scope === stack.top && source.length > 0) {
            var matched = rule.pattern.exec(source);
            if (matched) {
                scope.index += matched.index + matched[0].length;
                var skipped = source.slice(0, matched.index);
                rule.found && rule.found(scope, matched, skipped);
                scope.remainSource = source = source.slice(matched.index + matched[0].length);
            } else {
                scope.index += source.length;
                rule.notfound && rule.notfound(scope, source);
                scope.remainSource = source = '';
            }
            scope.loopCount++;
        }
        if (scope === stack.top && source.length === 0) {
            return this.stack.popScope();
        }

        return true;
    }

}

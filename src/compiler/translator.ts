/// <reference path="../errors.ts" />

module Jarty {

    export interface TranslationContext {
        source: string;
        write(...strs:string[]): void;
        nest(rule:TranslationRule, subSource?:string, callback?:(ctx:TranslationContext) => void): void;
        getLoopCount():number;
        raiseError(message:string): void;
    }

    export interface TranslationRule {
        enter?: (ctx:TranslationContext) => void;
        leave?: (ctx:TranslationContext) => void;

        pattern?: RegExp;
        found?: (ctx:TranslationContext, matched:RegExpExecArray, skipped:string) => void;
        notfound?: (ctx:TranslationContext, extra:string) => void;
    }


    class Scope {

        index:number = 0;
        errorIndex:number = 0;
        loopCount:number = 0;
        remainSource:string;
        resumeCallback:(ctx:TranslationContext) => void;

        constructor(public context:TranslationContext, public rule:TranslationRule, public source:string) {
            this.remainSource = source;
        }

        enter():void {
            this.rule.enter && this.rule.enter(this.context);
        }

        leave():void {
            this.rule.leave && this.rule.leave(this.context);
        }

        found(matched:RegExpExecArray):void {
            var skipped = this.remainSource.slice(0, matched.index);
            this.rule.found && this.rule.found(this.context, matched, skipped);

            this.errorIndex = this.index + matched.index;
            this.index += matched.index + matched[0].length;
            this.remainSource = this.remainSource.slice(matched.index + matched[0].length);
            this.loopCount++;
        }

        notfound():void {
            this.rule.notfound && this.rule.notfound(this.context, this.remainSource);

            this.errorIndex = this.index;
            this.index += this.remainSource.length;
            this.remainSource = '';
            this.loopCount++;
        }

        resume():void {
            if (this.resumeCallback) {
                this.resumeCallback(this.context);
                this.resumeCallback = undefined;
            }
        }

        next():boolean {
            if (!this.rule.pattern || this.remainSource.length === 0) {
                return false;
            }

            var matched = this.rule.pattern.exec(this.remainSource);
            if (matched) {
                this.found(matched);
                return true;
            } else {
                this.notfound();
                return false;
            }
        }

        toErrorPosition():ErrorPosition {
            var start = this.source.lastIndexOf("\n", this.errorIndex) + 1;
            var end = this.source.indexOf("\n", this.errorIndex);
            var breaks = this.source.substr(0, start).match(/\n/g);
            return {
                col: this.errorIndex - start + 1,
                row: breaks ? breaks.length + 1 : 1,
                line: this.source.substring(start, end === -1 ? this.source.length : end),
                source: this.source
            };
        }

    }

    class ScopeStack {

        public top:Scope;
        public stack:Scope[] = [];

        pushScope(scope:Scope):void {
            this.top = scope;
            this.stack.push(scope);
            this.top.enter();
        }

        popScope():void {
            if (!this.top) {
                throw new Error("Try to popScope on empty scope stack");
            }

            this.top.leave();
            this.stack.pop();

            if (this.stack.length > 0) {
                this.top = this.stack[this.stack.length - 1];
                this.top.resume();
            } else {
                this.top = null;
            }
        }

        getErrorPosition():ErrorPosition {
            if (this.stack.length > 0) {
                return this.stack[0].toErrorPosition();
            } else {
                return null;
            }
        }

    }

    class Context implements TranslationContext {

        private buffer: string = '';

        constructor(public stack:ScopeStack, public source:string) {
        }

        write(...strs:string[]):void {
            for (var i = 0; i < strs.length; i++) {
                this.buffer += strs[i];
            }
        }

        getTranslated(): string {
            return this.buffer;
        }

        nest(rule:TranslationRule, subSource?:string, callback?:(ctx:TranslationContext) => void):void {
            if (subSource === undefined) {
                subSource = this.stack.top.remainSource;
            }
            this.stack.top.resumeCallback = callback;
            this.stack.pushScope(new Scope(this, rule, subSource));
        }

        getLoopCount():number {
            return this.stack.top.loopCount;
        }

        raiseError(message:string):void {
            throw new SyntaxError("Jarty parse error: " + message, this.stack.getErrorPosition());
        }

    }

    export class Translator {

        constructor(public rootRule:TranslationRule) {
        }

        translate(source:string):string {
            var stack = new ScopeStack();
            var context = new Context(stack, source);

            stack.pushScope(new Scope(context, this.rootRule, source));
            while (stack.top) {
                if (stack.top.next() === false) {
                    stack.popScope();
                }
            }
            return context.getTranslated();
        }

    }

}

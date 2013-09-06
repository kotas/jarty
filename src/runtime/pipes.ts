/// <reference path="./interfaces.ts" />
/// <reference path="../utils.ts" />

export interface PipeFunction {
    apply(thisArg: any, argArray?: any): any;
    (runtime:RuntimeContext, value:any, ...args:any[]):any;
}

export class Pipe implements PipeStream {

    constructor(public value:any) {
    }

    static register(name:string, fn:PipeFunction):void {
        var wrapped:PipeStreamFunction = function (runtime:RuntimeContext, ...args:any[]):PipeStream {
            this.value = fn.apply(this, [runtime, this.value].concat(args));
            return <PipeStream>this;
        };
        (<any>Pipe).prototype[name] = wrapped;
    }

    static unregister(name:string):void {
        delete (<any>Pipe).prototype[name];
    }

    valueOf():any {
        return this.value;
    }

    toString():string {
        return Utils.stringify(this.value);
    }

}

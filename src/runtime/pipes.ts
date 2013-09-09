/// <reference path="./interfaces.ts" />
/// <reference path="../utils.ts" />

export class Pipe implements PipeStream {

    private static dict:{ [name:string]:PipeFunction } = {};

    static register(name:string, fn:PipeFunction):void {
        this.dict[name] = fn;
    }

    static unregister(name:string):void {
        delete this.dict[name];
    }

    static get(name:string):PipeFunction {
        return this.dict[name];
    }

    constructor(public runtime:RuntimeContext, public value:any) {
    }

    call(name:string, args:any[]):PipeStream {
        var fn = Pipe.dict[name];
        if (fn) {
            this.value = fn.apply(this, [this.runtime, this.value].concat(args));
        }
        return this;
    }

    valueOf():any {
        return this.value;
    }

    toString():string {
        return Utils.stringify(this.value);
    }

}

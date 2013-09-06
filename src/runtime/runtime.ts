/// <reference path="./interfaces.ts" />
/// <reference path="./global.ts" />
/// <reference path="./pipes.ts" />
/// <reference path="../exceptions.ts" />
/// <reference path="../utils.ts" />
/// <reference path="../version.ts" />

export class Environment implements RuntimeEnvironment {

    foreachs:{ [index: string]: Foreach } = {};
    captures:{ [index: string]: string } = {};
    counters:{ [index: string]: Counter } = {};

    constructor(private runtime:RuntimeContext) {
    }

    getNow(): number {
        return (new Date()).getTime();
    }

    getConst(): void {
        this.runtime.raiseError("not implemented: $jarty.const");
    }

    getVersion(): string {
        return version;
    }

    getLdelim(): string {
        return "{";
    }

    getRdelim(): string {
        return "}";
    }

    getForeach(name: string, key: string): any {
        if (!name) {
            this.runtime.raiseError("`$jarty.foreach` must be followed by foreach name");
        }
        if (!key) {
            this.runtime.raiseError("`$jarty.foreach." + name + "` must be followed by property name");
        }
        if (!this.foreachs.hasOwnProperty(key)) {
            this.runtime.raiseError("`$jarty.foreach." + name + "." + key + "` does not exist");
        }
        return this.foreachs[name][key];
    }

    getCapture(name: string): string {
        if (!name) {
            this.runtime.raiseError("`$jarty.capture` must be followed by capture name");
        }
        if (!this.captures.hasOwnProperty(name)) {
            this.runtime.raiseError("`$jarty.capture." + name + "` does not exist");
        }
        return this.captures[name];
    }

}

export class Runtime implements RuntimeContext {

    private buffer:string = "";
    dict:Dictionary;
    env:RuntimeEnvironment;

    constructor(dict:Dictionary) {
        this.dict = global.wrap(dict);
        this.env = new Environment(this);
    }

    write(str:string):void {
        if (str !== undefined && str !== null) {
            this.buffer += str;
        }
    }

    finish():string {
        return this.buffer;
    }

    raiseError(message:string):void {
        throw new RuntimeError(message);
    }

    set(key:string, value:any):void {
        this.dict[key] = value;
    }

    get(key:string, suffixes?:any[]):any {
        if (!(key in this.dict)) {
            return null;
        }
        if (!suffixes || suffixes.length === 0) {
            return this.dict[key];
        }

        var value:any = this.dict[key];
        var lastValue:any = null;
        var i:number = 0;
        var suffix:any;
        var receiver:any;

        while (value !== null && value !== undefined && i < suffixes.length) {
            suffix = suffixes[i++];
            if (suffix instanceof Array) { // method call (suffix is arguments)
                if (value instanceof Function) {
                    receiver = lastValue;
                    lastValue = value;
                    value = value.apply(receiver, suffix);
                } else {
                    return null;
                }
            } else { // property access (suffix is property name)
                if (suffix in value) {
                    lastValue = value;
                    value = value[suffix];
                } else {
                    return null;
                }
            }
        }
        return value;
    }

    getEnvVar(suffixes:string[]):any {
        if (suffixes.length === 0) {
            return null;
        }
        var key = suffixes[0], args = suffixes.slice(1);
        var method = "get" + Utils.camelize(key);
        if (typeof this.env[method] !== "function") {
            this.raiseError("`$jarty." + key + "` does not exist");
        }
        return this.env[method].apply(this.env, args);
    }

    pipe(value:any):PipeStream {
        return new Pipe(value);
    }

    call(method:string, args?:TagParameters):any {

    }

    foreach(params:TagParameters, yieldFunc:() => void, elseFunc?:() => void):void {

    }

    for_(params:TagParameters, yieldFunc:() => void, elseFunc?:() => void):void {

    }

    startCapture(name:string, assign:string):void {

    }

    endCapture():void {

    }

    startStrip():void {

    }

    endStrip():void {

    }

}

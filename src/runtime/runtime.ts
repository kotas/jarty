/// <reference path="../utils.ts" />
/// <reference path="../errors.ts" />
/// <reference path="interfaces.ts" />
/// <reference path="global.ts" />
/// <reference path="environment.ts" />
/// <reference path="pipes.ts" />
/// <reference path="functions.ts" />

module Jarty {

    export class Runtime implements RuntimeContext {

        private buffer:string = "";
        dict:Object;
        env:RuntimeEnvironment;

        constructor(dict:Object) {
            this.dict = Global.wrap(dict);
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
            throw new RuntimeError(message, this);
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
            var method = "get" + camelize(key);
            if (typeof this.env[method] !== "function") {
                this.raiseError("`$jarty." + key + "` does not exist");
            }
            return this.env[method].apply(this.env, args);
        }

        pipe(value:any):PipeStream {
            return new Pipes(this, value);
        }

        call(method:string, args?:Object):any {
            var fn = Functions.get(method);
            if (fn) {
                return fn(this, args);
            } else {
                return null;
            }
        }

        foreach(params:Object, yieldFunc:() => void, elseFunc?:() => void):void {

        }

        for_(params:Object, yieldFunc:() => void, elseFunc?:() => void):void {

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

}

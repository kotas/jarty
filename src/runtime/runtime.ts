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
            if (!params.hasOwnProperty('from')) {
                this.raiseError("foreach: `from` is not given");
            }
            if (!params.hasOwnProperty('item')) {
                this.raiseError("foreach: `item` is not given");
            }
            if (!params['from']) {
                return;
            }
            if (params.hasOwnProperty('name')) {
                this.namedForeach(params, yieldFunc, elseFunc);
                return;
            }

            var yielded = false, keyVar = params['key'], itemVar = params['item'];
            this.iterate(params['from'], (key, item) => {
                keyVar && (this.dict[keyVar] = key);
                this.dict[itemVar] = item;
                yieldFunc();
                yielded = true;
            });

            if (!yielded && elseFunc) {
                elseFunc();
            }
        }

        private namedForeach(params:Object, yieldFunc:() => void, elseFunc?:() => void):void {
            var from = params['from'];
            var total: number;
            if (typeof from['length'] === 'number') {
                total = from['length'];
            } else {
                total = 0;
                for (var key in from) {
                    if (from.hasOwnProperty(key)) {
                        total++;
                    }
                }
            }

            var ctx: Foreach = this.env.foreachs[params['name']] = {
                show: false,
                total: total,
                first: false,
                last: false,
                index: 0,
                iteration: 1
            };

            var yielded = false, keyVar = params['key'], itemVar = params['item'];
            this.iterate(from, (key, item, index) => {
                ctx.show = true;
                ctx.first = (index === 0);
                ctx.last = (index === total - 1);
                ctx.index = index;
                ctx.iteration = index + 1;

                keyVar && (this.dict[keyVar] = key);
                this.dict[itemVar] = item;
                yieldFunc();
                yielded = true;
            });

            if (!yielded && elseFunc) {
                elseFunc();
            }
        }

        private iterate(target:Object, callback:(key: any, item: any, index: number) => void) {
            if (!target) {
                return;
            }
            if (typeof target['length'] === 'number') {
                for (var i = 0, l = target['length']; i < l; i++) {
                    callback(i, target[i], i);
                }
            } else {
                var index = 0;
                for (var key in target) {
                    if (target.hasOwnProperty(key)) {
                        callback(key, target[key], index++);
                    }
                }
            }
        }

        for_(params:Object, yieldFunc:() => void, elseFunc?:() => void):void {
            if (!params.hasOwnProperty('to')) {
                this.raiseError("for: `to` is not given");
            }
            if (!params.hasOwnProperty('item')) {
                this.raiseError("for: `item` is not given");
            }

            var from: number = parseInt(params['from']) || 0;
            var to: number   = parseInt(params['to'])   || 0;
            var step: number = parseInt(params['step']) || 1;

            var yielded = false, itemVar = params['item'];
            if (step < 0) {
                for (var i = from; i >= to; i += step) {
                    this.dict[itemVar] = i;
                    yieldFunc();
                    yielded = true;
                }
            } else {
                for (var i = from; i <= to; i += step) {
                    this.dict[itemVar] = i;
                    yieldFunc();
                    yielded = true;
                }
            }

            if (!yielded && elseFunc) {
                elseFunc();
            }
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

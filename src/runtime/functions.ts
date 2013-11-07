/// <reference path="interfaces.ts" />

module Jarty {

    export class Functions {

        private static dict:{ [name:string]:TagFunction } = {};

        static register(name:string, fn:TagFunction):void {
            this.dict[name] = fn;
        }

        static unregister(name:string):void {
            delete this.dict[name];
        }

        static get(name:string):TagFunction {
            return this.dict[name];
        }

    }

}

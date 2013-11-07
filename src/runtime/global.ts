module Jarty {

    var GlobalNamespace = function (dict:Object):void {
        for (var key in dict) {
            if (dict.hasOwnProperty(key)) {
                this[key] = dict[key];
            }
        }
    };
    var GlobalProto = GlobalNamespace.prototype;

    export module Global {

        var globalUsed:boolean = false;

        export function set(...args:any[]):void {
            globalUsed = true;
            if (args.length === 1) {
                var dict = args[0];
                for (var key in dict) {
                    if (dict.hasOwnProperty(key)) {
                        GlobalProto[key] = args[1];
                    }
                }
            } else {
                GlobalProto[args[0]] = args[1];
            }
        }

        export function get(key:string):any {
            return GlobalProto[key];
        }

        export function remove(key:string):void {
            delete GlobalProto[key];
        }

        export function clear():void {
            globalUsed = false;
            GlobalProto = GlobalNamespace.prototype = {};
        }

        export function wrap(dict:Object):Object {
            return globalUsed ? new GlobalNamespace(dict) : dict;
        }

    }

}

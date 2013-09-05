/// <reference path="./interfaces.ts" />

var GlobalNamespace = function (dict: Dictionary): void {
    for (var key in dict) {
        if (dict.hasOwnProperty(key)) {
            this[key] = dict[key];
        }
    }
};

export interface Global {
    set(key: string, value: any): void;
    set(dict: Dictionary): void;
    get(key: string): any;
    remove(key: string): void;
    clear(): void;
    wrap(dict: Dictionary): Dictionary;
}

var globalUsed: boolean = false;

export var global: Global = {

    set: (...args: any[]): void => {
        globalUsed = true;
        if (args.length === 1) {
            var dict = args[0];
            for (var key in dict) {
                if (dict.hasOwnProperty(key)) {
                    GlobalNamespace.prototype[key] = args[1];
                }
            }
        } else {
            GlobalNamespace.prototype[args[0]] = args[1];
        }
    },

    get: (key: string): any => {
        return GlobalNamespace.prototype[key];
    },

    remove: (key: string): void => {
        delete GlobalNamespace.prototype[key];
    },

    clear: (): void => {
        globalUsed = false;
        GlobalNamespace.prototype = {};
    },

    wrap: (dict: Dictionary): Dictionary => {
        return globalUsed ? <Dictionary> new GlobalNamespace(dict) : dict;
    }

};

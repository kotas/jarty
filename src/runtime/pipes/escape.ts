/// <reference path="./core.ts" />

export module Escape {

    var zeroPad = Utils.zeroPad;

    var htmlEscapeChars = {
        '&': '&amp;',
        '"': '&quot;',
        "'": '&#039;',
        '<': '&lt;',
        '>': '&gt;'
    };

    var jsEscapeChars = {
        '\\': '\\\\',
        "'": "\\'",
        '"': '\\"',
        "\r": "\\r",
        "\n": "\\n",
        "</": "<\\/"
    };

    export function html(value: string): string {
        return value.replace(/[&"'<>]/g, function ($0) {
            return htmlEscapeChars[$0];
        });
    }

    export function htmlall(value:string):string {
        throw "not implemented: htmlall";
    }

    export function url(value: string):string {
        return encodeURIComponent(value);
    }

    export function urlpathinfo(value:string):string {
        return encodeURIComponent(value).replace(/%2F/g, '/');
    }

    export function quotes(value:string):string {
        return value.replace(/((?:[^\\']|\\.)+)|(')/g, function ($0, $1, $2) {
            return $2 ? "\\'" : $1;
        });
    }

    export function hex(value:string):string {
        var newValue = encodeURIComponent(value);
        return newValue.replace(/(%[0-9A-F]{2})|(.)/g, function ($0, $1, $2) {
            return $1 ? $1 : "%" + $2.charCodeAt(0).toString(16);
        });
    }

    export function hexentity(value:string):string {
        var newValue = "";
        for (var i = 0, l = value.length; i < l; i++) {
            var code = value.charCodeAt(i);
            newValue += "&#x" + zeroPad(code, code > 0xFF ? 4 : 2, 16) + ";";
        }
        return newValue;
    }

    export function decentity(value:string):string {
        var newValue = "";
        for (var i = 0, l = value.length; i < l; i++) {
            newValue += "&#" + value.charCodeAt(i) + ";";
        }
        return newValue;
    }

    export function javascript(value:string):string {
        return value.replace(/[\\'"\r\n]|<\//g, function ($0) {
            return jsEscapeChars[$0];
        });
    }

    export function mail(value:string):string {
        return value.replace(/@/g, ' [AT] ').replace(/\./g, ' [DOT] ');
    }

}

Pipe.register("escape", (runtime:RuntimeContext, value:any, format:string = "html"): string => {
    if (typeof Escape[format] !== "function") {
        runtime.raiseError("escape: format `" + format + "` does not exist");
    }
    return Escape[format](stringify(value));
});

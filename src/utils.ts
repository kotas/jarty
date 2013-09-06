module Utils {

    export function stringify(value:any):string {
        return (value === null || value === undefined) ? "" : String(value);
    }

    export function zeroPad(num:number, width:number, radix:number = 10) {
        var s = num.toString(radix);
        while (s.length < width) {
            s = "0" + s;
        }
        return s.toUpperCase();
    }

    var quoteMap = {
        '\b': '\\b',
        '\t': '\\t',
        '\n': '\\n',
        '\f': '\\f',
        '\r': '\\r',
        '\\': '\\\\'
    };

    export function quote(value:any):string {
        var s = stringify(value).replace(/[\x00-\x1f\\]/g, (chr:string) => {
            return quoteMap[chr] || '\\u00' + zeroPad(chr.charCodeAt(0), 2, 16);
        });
        return '"' + s.replace(/"/g, '\\"') + '"';
    }

    export function camelize(str:string):string {
        return str.replace(/(?:^|_)([a-z])/g, ($0, $1) => {
            return $1.toUpperCase();
        });
    }

}

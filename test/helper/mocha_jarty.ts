/// <reference path="../../definitions/mocha/mocha.d.ts" />
/// <reference path="../../compiled/jarty.d.ts" />

declare var mocha:any;
declare var js_beautify:Function;

module MochaJarty {

    var last:{
        source:string;
        dict:Jarty.Dictionary;
        compiled?:Function;
        output?:string;
    };

    export function render(source:string, dict?:Jarty.Dictionary):string {
        last = {
            source: source,
            dict: dict
        };
        last.compiled = Jarty.compile(source);
        last.output = <any>last.compiled.call(null, dict);
        return last.output;
    }

    function tidy(fn:Function):string {
        var body = fn.toString().replace(/^(.|\n)+?\{\s*/, "").replace(/\s*\}\s*$/, "");
        body = body.replace(/var Jarty = .+?;/, "");
        body = body.replace(/var r = .+?;/, "");
        body = body.replace(/return r\.finish\(\);/, "");
        body = body.replace(/\(/g, "(\n").replace(/\)/g, "\n)");
        body = body.replace(/\(\n+([^\(\)]*?)\n+\)/g, "($1)");
        body = body.replace(/(\.(call|valueOf)\()/g, "\n$1");
        return js_beautify(body);
    }

    var oldReporter = mocha._reporter;
    var Reporter = function (runner:any) {
        oldReporter.apply(this, arguments);

        runner.on("test", (test:any) => {
            last = null;
        });

        runner.on("fail", (test:any, err:any) => {
            if (last) {
                console.log("Error:", err.message || err);
                console.log("- Source:  ", last.source);
                console.log("- Dict:    ", last.dict);
                console.log("- Compiled:");
                console.log(last.compiled && tidy(last.compiled));
                console.log("- Output:");
                console.log(last.output);
            }
        });
    };

    mocha.reporter(Reporter);

}

// Export to global
var render = MochaJarty.render;

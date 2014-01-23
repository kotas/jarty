/// <reference path="../definitions/mocha.d.ts" />
/// <reference path="../definitions/chai.d.ts" />
/// <reference path="../src/jarty.ts" />

declare var mocha:any;
declare var js_beautify:Function;

module MochaJarty {

    var last:{
        source:string;
        dict:Object;
        compiled?:Function;
        output?:string;
    };

    export function render(source:string, dict?:Object):string {
        last = {
            source: source,
            dict: dict
        };
        last.compiled = Jarty.compile(source);
        last.output = <any>last.compiled.call(null, dict);
        return last.output;
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
                if (last.compiled && last.compiled['jartyCompiled']) {
                    console.log("- Compiled:");
                    console.log(js_beautify(last.compiled['jartyCompiled']));
                }
                if (last.output) {
                    console.log("- Output:");
                    console.log(last.output);
                }
            }
        });
    };

    mocha.reporter(<any>Reporter);

}

// Export to global
var render = MochaJarty.render;
var expect = chai.expect;

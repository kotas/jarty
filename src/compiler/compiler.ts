/// <reference path="./interfaces.ts" />
/// <reference path="./rules.ts" />
/// <reference path="./translator.ts" />
/// <reference path="../utils.ts" />

declare var Jarty:any;

export class Compiler {

    private rule:Rule;

    constructor(rule?:Rule) {
        this.rule = rule || Rules.start;
    }

    compileToString(source:string):string {
        source = Utils.stringify(source);
        var script:string = "";
        var buffer:Buffer = {
            write: (...strs:string[]) => {
                for (var i = 0; i < strs.length; i++) {
                    script += strs[i];
                }
            }
        };
        var translator = new Translator(buffer, this.rule);
        translator.run(source);
        return script;
    }

    compileToFunction(source:string):Function {
        var script = this.compileToString(source);
        try {
            var compiled = new Function("_", script);
        } catch (e) {
            throw new SyntaxError(
                "Jarty compile error: " + (e.message || e) + "\n" +
                    (script.length > 60 ? script.substr(0, 60) + "..." : script)
            );
        }
        compiled["__jarty__"] = Jarty;
        return compiled;
    }

}

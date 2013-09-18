/// <reference path="./interfaces.ts" />
/// <reference path="./../utils.ts" />

export module Rules {

    var quote = Utils.quote;

    // literal string with double-quotes  ex: "abc"
    var eDoubleQuoteString = '"[^"\\\\]*(?:\\\\.[^"\\\\]*)*"';
    // literal string with single-quotes  ex: 'abc'
    var eSingleQuoteString = '\'[^\'\\\\]*(?:\\\\.[^\'\\\\]*)*\'';
    // literal string  ex: "abc" or 'abc'
    var eString = '(?:' + eDoubleQuoteString + '|' + eSingleQuoteString + ')';
    // literal number  ex: 123 -3.14
    var eNumber = '(?:[+-]?\\d+(?:\\.\\d+)?)';
    // symbol  ex: abc
    var eSymbol = '[a-zA-Z_][a-zA-Z0-9_]*';

    // function call suffix  ex:  (foo, bar)
    var eFuncCall = '(?:\\([^\\)]*\\))';
    // indexer  ex: [abc]  [123]
    var eIndexer = '(?:\\[(?:[^\\[\\]]+|\\[[^\\]]+\\])+\\])';
    // variable suffix  ex: .abc  ->abc  .$abc  ->$abc  [abc]  (abc)
    var eVariableSuffix = '(?:(?:\\.|->)' + eSymbol + '|(?:\\.|->)\\$' + eSymbol + eIndexer + '*|' + eIndexer + '|' + eFuncCall + ')';
    // variable reference  ex:  $abc  $abc[123]  $abc.def
    // $1 = variable name, $2 = variable suffix
    var eVariable = '(?:\\$(' + eSymbol + ')(' + eVariableSuffix + '*))';
    // scalar  ex:  $abc  "abc"  123  abc
    // $1 = variable name, $2 = variable suffix, $3 = literal string, $4 = literal number, $5 = symbol
    var eScalar = '(?:' + eVariable + '|(' + eString + ')|(' + eNumber + ')|(' + eSymbol + '))';
    // pipe suffix  ex:  |foo  |@bar  |foo:$bar:123
    // $1 = pipe parameters
    var ePipe = '(?:\\|@?' + eSymbol + '(?::' + eScalar + ')*)';
    // value  ex: $abc[def]|ghi:jkl|hij:123
    // $1 - $5 = same as eScalar, $6 = pipes
    var eValue = eScalar + '(' + ePipe + '*)';
    // operators  ex: ( && || == )
    var eOperators = '(?:\\(|\\)|&&|\\|\\||===?|>=|<=|!=|[!><%+/*-])';

    // comment tag  ex: {* foo bar *}
    var eCommentTag = '\\{\\*(.*?)\\*\\}';
    // literal block  ex:  {literal} abc {/literal}
    var eLiteralBlock = '\\{\\s*literal\\s*\\}(.*?)\\{\\s*/literal\\s*\\}';
    // javascript block  ex:  {javascript} alert(123); {/javascript}
    var eJavaScriptBlock = '\\{\\s*javascript\\s*\\}(.*?)\\{\\s*/javascript\\s*\\}';
    // variable embed tag  ex:  {$abc}  {$foo.bar|baz} {"abc"} {123}
    var eEmbedTag = '\\{\\s*((?:\\$' + eSymbol + '|' + eString + '|' + eNumber + ').*?)\\s*\\}';
    // block open tag  ex: {foo}  {bar baz=123}
    var eOpenTag = '\\{\\s*(' + eSymbol + '.*?)\\s*\\}';
    // block close tag  ex:  {/foo}  {/bar}
    var eCloseTag = '\\{\\s*/(' + eSymbol + ')\\s*\\}';

    export var SpecialTags:{ [index: string]: Rule } = {
        "if": Rules.inIfTag,
        "else": Rules.inElseTag,
        "elseif": Rules.inElseIfTag,
        "/if": Rules.inEndIfTag,
        "foreach": Rules.inForeachTag,
        "foreachelse": Rules.inForeachElseTag,
        "/foreach": Rules.inEndForeachTag,
        "for": Rules.inForTag,
        "forelse": Rules.inForElseTag,
        "/for": Rules.inEndForTag
    };

    export var SpecialBarewords:{ [index: string]: string } = {
        "true": "true",
        "false": "false",
        "null": "null",
        "undefined": "undefined",
        "NaN": "NaN"
    };

    export var start:Rule = {
        enter: (ctx:Context) => {
            ctx.write(
                "var Jarty = arguments.callee.__jarty__;" +
                    "var r = new Jarty.Runtime(_ || {});"
            );
        },

        leave: (ctx:Context) => {
            ctx.write("return r.finish();");
        },

        pattern: new RegExp([
            eCommentTag,
            eLiteralBlock,
            eJavaScriptBlock,
            eEmbedTag,
            eOpenTag,
            eCloseTag
        ].join("|")),

        found: (ctx:Context, matched:RegExpExecArray, skipped:string) => {
            if (skipped.length > 0) {
                ctx.write("r.write(", quote(skipped), ");");
            }

            if (matched[1]) { // Comment Tag
                /* skip */
            } else if (matched[2]) { // Literal Block
                ctx.write("r.write(", quote(matched[2]), ");");
            } else if (matched[3]) { // JavaScript Block
                ctx.write(matched[3]);
            } else if (matched[4]) { // Embed Tag
                ctx.nest(inEmbedTag, matched[4]);
            } else if (matched[5]) { // Open Tag
                ctx.nest(inOpenTag, matched[5]);
            } else if (matched[6]) { // Close Tag
                ctx.nest(inCloseTag, matched[6]);
            }
        },

        notfound: (ctx:Context, extra:string) => {
            ctx.write("r.write(", quote(extra), ");");
        }
    };

    export var inEmbedTag:Rule = {
        enter: (ctx:Context) => {
            ctx.write("r.write(");
            ctx.nest(inValue);
        },

        leave: (ctx:Context) => {
            ctx.write(");");
        }
    };

    export var inOpenTag:Rule = {
        pattern: new RegExp('^(' + eSymbol + ')(.*)$'),

        found: (ctx:Context, matched:RegExpExecArray) => {
            var method = matched[1].toLowerCase();
            if (SpecialTags[method]) {
                ctx.nest(SpecialTags[method], matched[0]);
            } else {
                ctx.write("r.call(", quote(method), ",");
                if (matched[2]) {
                    ctx.nest(inOpenTagArgs, matched[2], (ctx:Context) => {
                        ctx.write(");");
                    });
                } else {
                    ctx.write("{});");
                }
            }
        },

        notfound: (ctx:Context) => {
            ctx.raiseError("invalid open tag");
        }
    };

    export var inOpenTagArgs:Rule = {
        enter: (ctx:Context) => {
            ctx.write("{");
        },

        leave: (ctx:Context) => {
            ctx.write("}");
        },

        pattern: new RegExp('^\\s+(' + eSymbol + ')=(' + eValue + ')'),

        found: (ctx:Context, matched:RegExpExecArray) => {
            if (ctx.getLoopCount() > 0) {
                ctx.write(",");
            }
            ctx.write(matched[1], ":");
            ctx.nest(inValue, matched[2]);
        },

        notfound: (ctx:Context) => {
            ctx.raiseError("invalid open tag argument");
        }
    };

    export var inCloseTag:Rule = {
        pattern: new RegExp('^(' + eSymbol + ')$'),

        found: (ctx:Context, matched:RegExpExecArray) => {
            var method = matched[1].toLowerCase();
            if (SpecialTags["/" + method]) {
                ctx.nest(SpecialTags["/" + method], matched[0]);
            } else {
                ctx.write("r.call(", quote(method + "Close"), ");");
            }
        },

        notfound: (ctx:Context) => {
            ctx.raiseError("invalid close tag");
        }
    };

    export var inValue:Rule = {
        pattern: new RegExp(eValue),

        found: function (ctx:Context, matched:RegExpExecArray) {
            var closePipe:(ctx:Context) => void;

            if (matched[6]) { // has pipe
                ctx.write("r.pipe(");
                closePipe = (ctx:Context) => {
                    ctx.write(")");
                    ctx.nest(inPipe, matched[6], (ctx:Context) => {
                        ctx.write(".valueOf()");
                    });
                };
            }

            if (matched[1]) { // variable
                if (matched[2]) { // has variable suffix
                    if (matched[1] === "smarty" || matched[1] === "jarty") { // special variable
                        ctx.write("r.getEnvVar(");
                    } else {
                        ctx.write("r.get(", quote(matched[1]), ",");
                    }
                    var oldClosePipe = closePipe;
                    ctx.nest(inVariableSuffix, matched[2], (ctx:Context) => {
                        ctx.write(")");
                        oldClosePipe && oldClosePipe.call(this, ctx);
                    });
                    closePipe = undefined;
                } else {
                    ctx.write("r.dict[", quote(matched[1]), "]");
                }
            } else if (matched[3]) { // string
                if (matched[3].length <= 2) {
                    ctx.write('""');
                } else {
                    ctx.nest(inString, matched[3].slice(1, -1), closePipe);
                    closePipe = undefined;
                }
            } else if (matched[4]) { // number
                ctx.write(matched[4]);
            } else if (matched[5]) { // bare word
                if (SpecialBarewords[matched[5]]) {
                    ctx.write(SpecialBarewords[matched[5]]);
                } else {
                    ctx.write(quote(matched[5]));
                }
            }

            if (closePipe) {
                closePipe.call(this, ctx);
            }
        },

        notfound: (ctx:Context) => {
            ctx.raiseError("invalid value");
        }
    };

    export var inVariableSuffix:Rule = {
        enter: (ctx:Context) => {
            ctx.write("[");
        },

        leave: (ctx:Context) => {
            ctx.write("]");
        },

        pattern: new RegExp(
            '^(?:' +
                [
                    '(?:\\.|->)(' + eSymbol + ')',
                    '(?:\\.|->)\\$(' + eSymbol + ')(' + eIndexer + '*)',
                    '(' + eIndexer + ')',
                    '(' + eFuncCall + ')'
                ].join('|') +
            ')'
        ),

        found: (ctx:Context, matched:RegExpExecArray) => {
            if (ctx.getLoopCount() > 0) {
                ctx.write(",");
            }
            if (matched[1]) { // property access (ex: $foo.abc $foo->abc)
                ctx.write(quote(matched[1]));
            } else if (matched[2]) { // referenced property access (ex: $foo.$abc $foo->$abc)
                if (matched[3]) {
                    ctx.write("r.get(", quote(matched[2]), ",");
                    ctx.nest(inVariableSuffix, matched[3], (ctx:Context) => {
                        ctx.write(")");
                    });
                } else {
                    ctx.write("r.dict[", quote(matched[2]), "]");
                }
            } else if (matched[4]) { // indexer access (ex: $foo[123] $foo["abc"])
                ctx.nest(inIndexer, matched[4]);
            } else { // function call (ex: $foo(1,2,3))
                ctx.nest(inFuncCall, matched[5]);
            }
        },

        notfound: (ctx:Context) => {
            ctx.raiseError("invalid value indexer");
        }
    };

    export var inIndexer:Rule = {
        pattern: /^\[\s*((?:[^\[\]]|\[[^\]]+\])+)\s*\]/,

        found: (ctx:Context, matched:RegExpExecArray) => {
            ctx.nest(inValue, matched[1]);
        },

        notfound: (ctx:Context) => {
            ctx.raiseError("invalid indexer");
        }
    };

    export var inFuncCall:Rule = {
        pattern: /^\(\s*([^\)]*)\s*\)/,

        found: (ctx:Context, matched:RegExpExecArray) => {
            ctx.write("[");
            ctx.nest(inFuncCallArgs, matched[1], (ctx:Context) => {
                ctx.write("]");
            });
        },

        notfound: (ctx:Context) => {
            ctx.raiseError("invalid function call");
        }
    };

    export var inFuncCallArgs:Rule = {
        pattern: new RegExp('^(\\,?)\\s*(' + eValue + ')'),

        found: (ctx:Context, matched:RegExpExecArray) => {
            if (matched[1]) {
                ctx.write(",");
            }
            ctx.nest(inValue, matched[2]);
        },

        notfound: (ctx:Context) => {
            ctx.raiseError("invalid function arguments");
        }
    };

    export var inString:Rule = {
        pattern: new RegExp('^((?:[^\\\\`]+|\\\\u[0-9a-fA-F]{4}|\\\\x[0-9a-fA-F]{2}|\\\\.)+)|^`(' + eValue + ')`'),

        found: (ctx:Context, matched:RegExpExecArray) => {
            if (ctx.getLoopCount() > 0) {
                ctx.write("+");
            }
            if (matched[1]) {
                ctx.write(quote(matched[1]));
            } else if (matched[2]) {
                ctx.nest(inValue, matched[2]);
            }
        }
    };

    export var inPipe:Rule = {
        pattern: new RegExp('^\\|@?(' + eSymbol + ')((?::' + eScalar + ')*)'),

        found: (ctx:Context, matched:RegExpExecArray) => {
            ctx.write(".call(", quote(matched[1]), ", [");
            if (matched[2]) {
                ctx.nest(inPipeArgs, matched[2], (ctx:Context) => {
                    ctx.write("])");
                });
            } else {
                ctx.write("])");
            }
        },

        notfound: (ctx:Context) => {
            ctx.raiseError("invalid pipe");
        }
    };

    export var inPipeArgs:Rule = {
        pattern: new RegExp('^:(' + eScalar + ')'),

        found: (ctx:Context, matched:RegExpExecArray) => {
            if (ctx.getLoopCount() > 0) {
                ctx.write(",");
            }
            ctx.nest(inValue, matched[1]);
        },

        notfound: (ctx:Context) => {
            ctx.raiseError("invalid pipe argument");
        }
    };


    export var inIfTag:Rule = {
        enter: (ctx:Context) => {
            ctx.write("if (");
        },

        leave: (ctx:Context) => {
            ctx.write(") {");
        },

        pattern: /^if\s+(.+)$/,

        found: (ctx:Context, matched:RegExpExecArray) => {
            ctx.nest(inIfCondition, matched[1]);
        },

        notfound: (ctx:Context) => {
            ctx.raiseError("invalid if tag");
        }
    };

    export var inElseTag:Rule = {
        enter: (ctx:Context) => {
            ctx.write("} else {");
        }
    };

    export var inElseIfTag:Rule = {
        enter: (ctx:Context) => {
            ctx.write("} else if (");
        },

        leave: (ctx:Context) => {
            ctx.write(") {");
        },

        pattern: /^elseif\s+(.+)$/,

        found: (ctx:Context, matched:RegExpExecArray) => {
            ctx.nest(inIfCondition, matched[1]);
        },

        notfound: (ctx:Context) => {
            ctx.raiseError("invalid elseif tag");
        }
    };

    export var inEndIfTag:Rule = {
        enter: (ctx:Context) => {
            ctx.write("}");
        }
    };

    export var inIfCondition:Rule = {
        pattern: new RegExp('^\\s*(?:(' + eOperators + ')|(and)|(or)|(not)|(' + eValue + '))'),

        found: (ctx:Context, matched:RegExpExecArray) => {
            if (matched[1]) {
                ctx.write(matched[1]);
            } else if (matched[2]) {
                ctx.write("&&");
            } else if (matched[3]) {
                ctx.write("||");
            } else if (matched[4]) {
                ctx.write("!");
            } else if (matched[5]) {
                ctx.nest(inValue, matched[5]);
            }
        },

        notfound: (ctx:Context) => {
            ctx.raiseError("invalid if condition");
        }
    };

    export var inForeachTag:Rule = {
        pattern: /^foreach(\s+.+)$/,

        found: (ctx:Context, matched:RegExpExecArray) => {
            ctx.write("r.foreach(");
            ctx.nest(inOpenTagArgs, matched[1], (ctx:Context) => {
                ctx.write(", function () {");
            });
        },

        notfound: (ctx:Context) => {
            ctx.raiseError("invalid foreach tag");
        }
    };

    export var inForeachElseTag:Rule = {
        enter: (ctx:Context) => {
            ctx.write("}, function () {");
        }
    };

    export var inEndForeachTag:Rule = {
        enter: (ctx:Context) => {
            ctx.write("});");
        }
    };

    export var inForTag:Rule = {
        pattern: /^for(\s+.+)$/,

        found: (ctx:Context, matched:RegExpExecArray) => {
            ctx.write("r.for_(");
            ctx.nest(inOpenTagArgs, matched[1], (ctx:Context) => {
                ctx.write(", function () {");
            });
        },

        notfound: (ctx:Context) => {
            ctx.raiseError("invalid for tag");
        }
    };

    export var inForElseTag:Rule = {
        enter: (ctx:Context) => {
            ctx.write("}, function () {");
        }
    };

    export var inEndForTag:Rule = {
        enter: (ctx:Context) => {
            ctx.write("});");
        }
    };

}

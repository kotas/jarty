/// <reference path="./compiler.ts" />
/// <reference path="./function.ts" />
/// <reference path="./utils.ts" />

export module Rules {
    
    var quote = Utils.quote;

    var eDoubleQuoteString = '"[^"\\\\]*(?:\\\\.[^"\\\\]*)*"';
    var eSingleQuoteString = '\'[^\'\\\\]*(?:\\\\.[^\'\\\\]*)*\'';
    var eString = '(?:' + eDoubleQuoteString + '|' + eSingleQuoteString + ')';
    var eNumber = '(?:[+-]?\\d+(?:\\.\\d+)?)';
    var eSymbol = '\\w+';

    var eFuncCall = '(?:\\([^\\)]*\\))';
    var eIndexer = '(?:\\[(?:[^\\[\\]]+|\\[[^\\]]+\\])+\\])';
    var eVariableSuffix = '(?:(?:\\.|->)' + eSymbol + '|(?:\\.|->)\\$' + eSymbol + eIndexer + '*|' + eIndexer + '|' + eFuncCall + ')';
    var eVariable = '(?:\\$(' + eSymbol + ')(' + eVariableSuffix + '*))';
    var eScalar = '(?:' + eVariable + '|(' + eString + ')|(' + eNumber + ')|(' + eSymbol + '))';
    var ePipe = '(?:\\|@?' + eSymbol + '(?::' + eScalar + ')*)';
    var eValue = eScalar + '(' + ePipe + '*)';
    var eOperators = '(?:\\(|\\)|&&|\\|\\||===?|>=|<=|!=|[!><%+/*-])';

    var eCommentTag = '\\{\\*(.*?)\\*\\}';
    var eLiteralBlock = '\\{\\s*literal\\s*\\}(.*?)\\{\\s*/literal\\s*\\}';
    var eJavaScriptBlock = '\\{\\s*javascript\\s*\\}(.*?)\\{\\s*/javascript\\s*\\}';
    var eEmbedTag = '\\{\\s*(\\$' + eSymbol + '.*?)\\s*\\}';
    var eOpenTag = '\\{\\s*(' + eSymbol + '.*?)\\s*\\}';
    var eCloseTag = '\\{\\s*/(' + eSymbol + ')\\s*\\}';

    export var start: Rule;
    export var inEmbedTag: Rule;
    export var inOpenTag: Rule;
    export var inOpenTagArgs: Rule;
    export var inCloseTag: Rule;
    export var inValue: Rule;
    export var inEnvVar: Rule;
    export var inVariableSuffix: Rule;
    export var inIndexer: Rule;
    export var inFuncCall: Rule;
    export var inFuncCallArgs: Rule;
    export var inString: Rule;
    export var inPipe: Rule;
    export var inPipeArgs: Rule;

    export var inIfTag: Rule;
    export var inElseTag: Rule;
    export var inElseIfTag: Rule;
    export var inEndIfTag: Rule;
    export var inIfCondition: Rule;
    export var inForeachTag: Rule;
    export var inForeachElseTag: Rule;
    export var inEndForeachTag: Rule;
    export var inForTag: Rule;
    export var inForElseTag: Rule;
    export var inEndForTag: Rule;

    export var SpecialTags: { [index: string]: Rule };
    export var SpecialBarewords: { [index: string]: string };


    start = {
        enter: (ctx: Context) => {
            ctx.write(
                "c = c || {};",
                "if (Jarty.__globals) { c = new Jarty.Namespace(c); }",
                "var g = Jarty.Getter, r = new Jarty.Runtime(c), p = Jarty.Pipe, f = Jarty.Function;"
            );
        },

        leave: (ctx: Context) => {
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

        found: (ctx: Context, matched: string[], skipped: string) => {
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

        notfound: (ctx: Context, extra: string) => {
            ctx.write("r.write(", quote(extra), ");");
        }
    };

    inEmbedTag = {
        enter: (ctx: Context) => {
            ctx.write("r.write(");
            ctx.nest(inValue);
        },

        leave: (ctx: Context) => {
            ctx.write(");");
        }
    };

    inOpenTag = {
        search: new RegExp('^(' + eSymbol + ')(.*)$'),

        found: (ctx: Context, matched: string[]) => {
            var method = matched[1].toLowerCase();
            if (SpecialTags[method]) {
                ctx.nest(SpecialTags[method], matched[0]);
            } else if (Function[method]) {
                ctx.write("f[", quote(method), "]");
                if (matched[2]) {
                    ctx.write("(r,");
                    ctx.nest(inOpenTagArgs, matched[2], (ctx: Context) => {
                        ctx.write(");");
                    });
                } else {
                    ctx.write("(r, {});");
                }
            } else {
                ctx.raiseError("unknown tag: {" + method + "}");
            }
        },

        notfound: (ctx: Context) => {
            ctx.raiseError("invalid open tag");
        }
    };

    inOpenTagArgs = {
        enter: (ctx: Context) => {
            ctx.write("{");
        },

        leave: (ctx: Context) => {
            ctx.write("}");
        },

        search: new RegExp('^\\s+(' + eSymbol + ')=(' + eValue + ')'),

        found: (ctx: Context, matched: string[]) => {
            if (ctx.loopCount > 0) {
                ctx.write(",");
            }
            ctx.write(quote(matched[1]), ":");
            ctx.nest(inValue, matched[2]);
        },

        notfound: (ctx: Context) => {
            ctx.raiseError("invalid open tag argument");
        }
    };

    inCloseTag = {
        search: new RegExp('^(' + eSymbol + ')$'),

        found: (ctx: Context, matched: string[]) => {
            var method = matched[1].toLowerCase();
            if (SpecialTags["/" + method]) {
                ctx.nest(SpecialTags["/" + method], matched[0]);
            } else {
                ctx.write("f[", quote(method + "Close"), "](r);");
            }
        },

        notfound: (ctx: Context) => {
            ctx.raiseError("invalid close tag");
        }
    };

    inValue = {
        search: new RegExp(eValue),

        found: function (ctx: Context, matched: string[]) {
            var closePipe: Function;

            if (matched[6]) { // has pipe
                ctx.write("(new p(");
                closePipe = (ctx: Context) => {
                    ctx.write("))");
                    ctx.nest(inPipe, matched[6], (ctx: Context) => {
                        ctx.write(".valueOf()");
                    });
                };
            }

            if (matched[1]) { // variable
                if (matched[1] == "smarty" || matched[1] == "jarty") { // special variable
                    if (!matched[2]) {
                        ctx.raiseError("$" + matched[1] + " must be followed by a property name");
                    }
                    ctx.nest(inEnvVar, matched[2], closePipe);
                    closePipe = undefined;
                } else {
                    ctx.write("g(c,", quote(matched[1]));
                    if (matched[2]) { // has variable suffix
                        var oldClosePipe = closePipe;
                        ctx.nest(inVariableSuffix, matched[2], (ctx: Context) => {
                            ctx.write(")");
                            oldClosePipe && oldClosePipe.call(this, ctx);
                        });
                        closePipe = undefined;
                    } else {
                        ctx.write(")");
                    }
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

        notfound: (ctx: Context) => {
            ctx.raiseError("invalid value");
        }
    };

    inEnvVar = {
        enter: (ctx: Context) => {
            ctx.write("r.getEnvVar([");
        },

        leave: (ctx: Context) => {
            ctx.write("])");
        },

        search: new RegExp('^(?:(?:\\.|->)(' + eSymbol + ')|(?:\\.|->)\\$(' + eSymbol + ')(' + eIndexer + '*))'),

        found: (ctx: Context, matched: string[]) => {
            if (ctx.loopCount > 0) {
                ctx.write(",");
            }
            if (matched[1]) {
                ctx.write(quote(matched[1]));
            } else if (matched[2]) {
                ctx.write("g(c,", quote(matched[2]));
                if (matched[3]) {
                    ctx.nest(inIndexer, matched[3], (ctx: Context) => { ctx.write(")") });
                } else {
                    ctx.write(")");
                }
            }
        },

        notfound: (ctx: Context) => {
            ctx.raiseError("invalid envvar value");
        }
    };

    inVariableSuffix = {
        search: new RegExp('^(?:(?:\\.|->)(' + eSymbol + ')|(?:\\.|->)\\$(' + eSymbol + ')(' + eIndexer + '*)|(' + eIndexer + ')|(' + eFuncCall + '))'),

        found: (ctx: Context, matched: string[]) => {
            if (matched[1]) {
                ctx.write(",", quote(matched[1]));
            } else if (matched[2]) {
                ctx.write(",g(c,", quote(matched[2]));
                if (matched[3]) {
                    ctx.nest(inIndexer, matched[3], (ctx: Context) => { ctx.write(")") });
                } else {
                    ctx.write(")");
                }
            } else if (matched[4]) {
                ctx.nest(inIndexer, matched[4]);
            } else {
                ctx.nest(inFuncCall, matched[5]);
            }
        },

        notfound: (ctx: Context) => {
            ctx.raiseError("invalid value indexer");
        }
    };

    inIndexer = {
        search: /^\[\s*((?:[^\[\]]|\[[^\]]+\])+)\s*\]/,

        found: (ctx: Context, matched: string[]) => {
            ctx.write(",");
            ctx.nest(inValue, matched[1]);
        },

        notfound: (ctx: Context) => {
            ctx.raiseError("invalid indexer");
        }
    };

    inFuncCall = {
        search: /^\(\s*([^\)]*)\s*\)/,

        found: (ctx: Context, matched: string[]) => {
            ctx.write(",[");
            ctx.nest(inFuncCallArgs, matched[1], (ctx: Context) => {
                ctx.write("]");
            });
        },

        notfound: (ctx: Context) => {
            ctx.raiseError("invalid function call");
        }
    };

    inFuncCallArgs = {
        search: new RegExp('^(\\,?)\\s*(' + eValue + ')'),

        found: (ctx: Context, matched: string[]) => {
            if (matched[1]) {
                ctx.write(",");
            }
            ctx.nest(inValue, matched[2]);
        },

        notfound: (ctx: Context) => {
            ctx.raiseError("invalid function arguments");
        }
    };

    inString = {
        search: new RegExp('^((?:[^\\\\`]+|\\\\u[0-9a-fA-F]{4}|\\\\x[0-9a-fA-F]{2}|\\\\.)+)|^`(' + eValue + ')`'),

        found: (ctx: Context, matched: string[]) => {
            if (ctx.loopCount > 0) {
                ctx.write("+");
            }
            if (matched[1]) {
                ctx.write(quote(matched[1]));
            } else if (matched[2]) {
                ctx.nest(inValue, matched[2]);
            }
        }
    };

    inPipe = {
        search: new RegExp('^\\|@?(' + eSymbol + ')((?::' + eScalar + ')*)'),

        found: (ctx: Context, matched: string[]) => {
            var method = matched[1].replace(/_(.)/g, ($0, $1) => { return $1.toUpperCase() });
            ctx.write("[", quote(method), "](r");
            if (matched[2]) {
                ctx.nest(inPipeArgs, matched[2], (ctx: Context) => { ctx.write(")") });
            } else {
                ctx.write(")");
            }
        },

        notfound: (ctx: Context) {
            ctx.raiseError("invalid pipe");
        }
    };

    inPipeArgs = {
        search: new RegExp('^:(' + eScalar + ')'),

        found: (ctx: Context, matched: string[]) {
            ctx.write(",");
            ctx.nest(inValue, matched[1]);
        },

        notfound: (ctx: Context) {
            ctx.raiseError("invalid pipe argument");
        }
    };


    inIfTag = {
        enter: (ctx: Context) => {
            ctx.write("if (");
        },

        leave: (ctx: Context) => {
            ctx.write(") {");
        },

        search: /^if\s+(.+)$/,

        found: (ctx: Context, matched: string[]) => {
            ctx.nest(inIfCondition, matched[1]);
        },

        notfound: (ctx: Context) => {
            ctx.raiseError("invalid if tag");
        }
    };

    inElseTag = {
        enter: (ctx: Context) => {
            ctx.write("} else {");
        }
    };

    inElseIfTag = {
        enter: (ctx: Context) => {
            ctx.write("} else if (");
        },

        leave: (ctx: Context) => {
            ctx.write(") {");
        },

        search: /^elseif\s+(.+)$/,

        found: (ctx: Context, matched: string[]) => {
            ctx.nest(inIfCondition, matched[1]);
        },

        notfound: (ctx: Context) => {
            ctx.raiseError("invalid elseif tag");
        }
    };

    inEndIfTag = {
        enter: (ctx: Context) => {
            ctx.write("}");
        }
    };

    inIfCondition = {
        search: new RegExp('^\\s*(?:(' + eOperators + ')|(and)|(or)|(not)|(' + eValue + '))'),

        found: (ctx: Context, matched: string[]) => {
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

        notfound: (ctx: Context) => {
            ctx.raiseError("invalid if condition");
        }
    };

    inForeachTag = {
        search: /^foreach(\s+.+)$/,

        found: (ctx: Context, matched: string[]) => {
            ctx.write("r.foreach(");
            ctx.nest(inOpenTagArgs, matched[1], (ctx: Context) => {
                ctx.write(", function () {");
            });
        },

        notfound: (ctx: Context) => {
            ctx.raiseError("invalid foreach tag");
        }
    };

    inForeachElseTag = {
        enter: (ctx: Context) => {
            ctx.write("}, function () {");
        }
    };

    inEndForeachTag = {
        enter: (ctx: Context) => {
            ctx.write("});");
        }
    };

    inForTag = {
        search: /^for(\s+.+)$/,

        found: (ctx: Context, matched: string[]) => {
            ctx.write("r.for_(");
            ctx.nest(inOpenTagArgs, matched[1], (ctx: Context) => {
                ctx.write(", function () {");
            });
        },

        notfound: (ctx: Context) => {
            ctx.raiseError("invalid for tag");
        }
    };

    inForElseTag = {
        enter: (ctx: Context) => {
            ctx.write("}, function () {");
        }
    };

    inEndForTag = {
        enter: (ctx: Context) => {
            ctx.write("});");
        }
    };


    SpecialTags = {
        "if": inIfTag,
        "else": inElseTag,
        "elseif": inElseIfTag,
        "/if": inEndIfTag,
        "foreach": inForeachTag,
        "foreachelse": inForeachElseTag,
        "/foreach": inEndForeachTag,
        "for": inForTag,
        "forelse": inForElseTag,
        "/for": inEndForTag
    };

    SpecialBarewords = {
        "true": "true",
        "false": "false",
        "null": "null",
        "undefined": "undefined",
        "NaN": "NaN"
    };

}

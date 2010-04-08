JsUnitTest.Unit.Testcase.prototype.assertCompiled = function (expected, source, namespace, message) {
	var compiled, actual;
	try {
		compiled = this.compiler.compileToFunction(source);
	} catch (e) {
		this.warn("Error raised while compile phase.");
		this.error(e);
		return;
	}
//	this.info(source + " => " + compiled.toString());
	try {
		actual = compiled(namespace);
	} catch (e) {
		this.warn("Error raised while evaluate phase.");
		this.error(e);
		return;
	}
	if (expected === actual) {
		this.pass();
	} else {
		message = this.buildMessage(message || 'assertCompiled',
			"expected <?>, actual: <?>\ncompiled: <?>", expected, actual, compiled);
		this.fail(message);
	}
};


new Test.Unit.Runner({
	setup: function () {
		this.compiler = new Jarty.Compiler();
	},
	teardown: function () {
		delete this.compiler;
		Jarty.clearGlobals();
	},

	testInstantiate: function () {
		this.assert(this.compiler instanceof Jarty.Compiler);
	},
	testCompileToStringReturnsString: function () {
		this.assert(typeof this.compiler.compileToString("") == "string");
	},
	testCompileToFunctionReturnsFunction: function () {
		this.assert(typeof this.compiler.compileToFunction("") == "function");
	},
	testJartyCompileReturnsFunction: function () {
		this.assert(typeof Jarty.compile("") == "function");
	},

	testPlainTextKeeped: function () {
		this.assertCompiled("abc", "abc");
	},
	testNonStringBecomeString: function () {
		this.assertCompiled("", null);
		this.assertCompiled("", undefined);
		this.assertCompiled("123", 123);
		this.assertCompiled("123.45", 123.45);
	},

	testCommentTagSkipped: function () {
		this.assertCompiled("", "{* foo *}");
		this.assertCompiled("abc", "{* foo *}abc{* bar *}");
	},

	testLiteralTag: function () {
		this.assertCompiled("{abc}", "{literal}{abc}{/literal}");
	},

	testJavaScriptTag: function () {
		this.assertCompiled("abc", "{javascript} r.write('abc'); {/javascript}");
	},

	testEmbedVariable: function () {
		this.assertCompiled("abc", "{$foo}", { foo: "abc" });
		this.assertCompiled("abcdef", "{$foo}{$bar}", { foo: "abc", bar: "def" });
		this.assertCompiled("abcdefghijklmno", "abc{$foo}ghi{$bar}mno", { foo: "def", bar: "jkl" });
	},
	testEmbedUndefinedVariable: function () {
		this.assertCompiled("abc", "a{$foo}b{$bar}c");
	},
	testEmbedNullVariable: function () {
		this.assertCompiled("abc", "a{$foo}b{$bar}c", { foo: null, bar: null });
	},
	testEmbedVariableWithDots: function () {
		this.assertCompiled("abc", "{$foo.bar}", { foo: { bar: "abc" } });
		this.assertCompiled("abc", "{$foo.bar.baz}", { foo: { bar: { baz: "abc" } } });
		this.assertCompiled("abc", "{$foo.$bar.baz}", { foo: { hoge: { baz: "abc" } }, bar: "hoge" });
	},
	testEmbedVariableWithCursors: function () {
		this.assertCompiled("abc", "{$foo->bar}", { foo: { bar: "abc" } });
		this.assertCompiled("abc", "{$foo->bar->baz}", { foo: { bar: { baz: "abc" } } });
		this.assertCompiled("abc", "{$foo->$bar->baz}", { foo: { hoge: { baz: "abc" } }, bar: "hoge" });
	},
	testEmbedVariableWithIndexer: function () {
		this.assertCompiled("abc", "{$foo[bar]}", { foo: { bar: "abc" } });
		this.assertCompiled("abc", "{$foo[123]}", { foo: { 123: "abc"} });
		this.assertCompiled("abc", "{$foo['bar']}", { foo: { bar: "abc" } });
		this.assertCompiled("abc", '{$foo["bar"]}', { foo: { bar: "abc" } });
		this.assertCompiled("abc", '{$foo["\\\\bar\\"baz\\"\\nqux"]}', { foo: { '\\\\bar\\"baz\\"\\nqux': "abc" } });
		this.assertCompiled("abc", "{$foo[bar][baz]}", { foo: { bar: { baz: "abc" } } });
		this.assertCompiled("abc", "{$foo[$bar][baz]}", { foo: { hoge: { baz: "abc" } }, bar: "hoge" });
	},
	testEmbedVariableWithNestedIndexer: function () {
		this.assertCompiled("abc", "{$foo[$bar[baz]]}", { foo: { hoge: "abc" }, bar: { baz: "hoge" } });
	},
	testEmbedVariableWithTooNestedIndexerFails: function () {
		this.assertRaise("SyntaxError", function () {
			var compiled = Jarty.compile("{$foo[$bar[$bax[qux]]]}");
			compiled({ foo: { hoge: "abc" }, bar: { fuga: "hoge" }, baz: { qux: "fuga" } });
		});
	},
	testEmbedVariableWithFunctionCall: function () {
		this.assertCompiled("abc", "{$foo()}", { foo: function () { return "abc" } });
		this.assertCompiled("abc", "{$foo()()}", { foo: function () { return function () { return "abc" }; } });
	},
	testEmbedVariableWithFunctionCallParameter: function () {
		this.assertCompiled("123", "{$foo(123)}", { foo: function (a) { return a } });
		this.assertCompiled("444", "{$foo(123, 321)}", { foo: function (a, b) { return a + b } });
		this.assertCompiled("abc", "{$foo('abc')}", { foo: function (a) { return a } });
		this.assertCompiled("abc", "{$foo($bar)}", { foo: function (a) { return a }, bar: "abc" });
		this.assertCompiled("abcdef", "{$foo($bar, \"def\")}", { foo: function (a, b) { return a + b }, bar: "abc" });
	},
	testEmbedVariableWithNestedFunctionCallFails: function () {
		this.assertRaise("SyntaxError", function () {
			var compiled = Jarty.compile("{$foo($bar())}");
			compiled({ foo: function (a) { return a }, bar: function () { return "abc" } });
		});
	},
	testEmbedVariableWithComplicatedSuffix: function () {
		this.assertCompiled("abc", "{$foo.bar[baz]}", { foo: { bar: { baz: "abc" } } });
		this.assertCompiled("abc", "{$foo[bar].baz}", { foo: { bar: { baz: "abc" } } });
		this.assertCompiled("abc", "{$foo.bar().baz}", { foo: { bar: function () { return { baz: "abc" } } } });
		this.assertCompiled("abc", "{$foo.bar->baz()}", { foo: { bar: { baz: function () { return "abc" } } } })
		this.assertCompiled("abc", "{$foo.bar[baz]()}", { foo: { bar: { baz: function () { return "abc" } } } });
		this.assertCompiled("abc", "{$foo[$bar.baz]}", { foo: { hoge: "abc" }, bar: { baz: "hoge" } });
	},
	testEmbedVariableWithPipe: function () {
		this.assertCompiled("abc", "{$foo|lower}", { foo: "ABC" });
		this.assertCompiled("abc", "{$foo.bar|lower}", { foo: { bar: "ABC" } });
		this.assertCompiled("abc", "{$foo[bar]|lower}", { foo: { bar: "ABC" } });
		this.assertCompiled("abc", "{$foo()|lower}", { foo: function () { return "ABC" } });
		this.assertCompiled("abc", "{$foo|lower|lower}", { foo: "ABC" });
	},

	testEmbedVariableInString: function () {
		this.assertCompiled("abc", "{$foo['hoge`$bar`']}", { foo: { hogepiyo: "abc" }, bar: "piyo" });
		this.assertCompiled("abc", "{$foo['hoge`$bar.baz[$qux]`']}",
			{ foo: { hogepiyo: "abc" }, bar: { baz: { bee: "piyo" } }, qux: "bee" });
	},

	testEnvVarWithoutSuffixFails: function () {
		this.assertRaise("SyntaxError", function () {
			var compiled = Jarty.compile("{$jarty}");
			compiled();
		});
	},
	testEnvVarNowReturnsCurrentTime: function () {
		this.assertBlock("$Jarty.now failed", function () {
			var f = Jarty.compile("{$jarty.now}");
			var expected = (new Date()).getTime(), actual = f();
			actual = parseInt(actual);
			return Math.abs(expected - actual) < 2000;
		});
	},
	testEnvVarVersion: function () {
		this.assertCompiled(Jarty.version, "{$jarty.version}");
	},
	testEnvVarLdelim: function () {
		this.assertCompiled("{", "{$jarty.ldelim}");
	},
	testEnvVarRdelim: function () {
		this.assertCompiled("}", "{$jarty.rdelim}");
	},

	testPipeLower: function () {
		this.assertCompiled("abc", "{$foo|lower}", { foo: "ABC" });
		this.assertCompiled("abc", "{$foo|lower}", { foo: "Abc" });
		this.assertCompiled("123", "{$foo|lower}", { foo: 123 });
	},
	testPipeUpper: function () {
		this.assertCompiled("ABC", "{$foo|upper}", { foo: "abc" });
		this.assertCompiled("ABC", "{$foo|upper}", { foo: "Abc" });
	},
	testPipeCat: function () {
		this.assertCompiled("abcdef", "{$foo|cat:'def'}", { foo: "abc" });
		this.assertCompiled("abcdefghi", "{$foo|cat:$bar|cat:$baz.qux}", { foo: "abc", bar: "def", baz: { qux: "ghi" } });
	},
	testPipeCountCharacters: function () {
		this.assertCompiled("3", "{$foo|count_characters}", { foo: "abc" });
		this.assertCompiled("3", "{$foo|countCharacters}", { foo: "abc" });
		this.assertCompiled("6", "{$foo|count_characters}", { foo: "abc def" });
		this.assertCompiled("7", "{$foo|count_characters:true}", { foo: "abc def" });
	},
	testPipeCountParagraphs: function () {
		this.assertCompiled("3", "{$foo|count_paragraphs}", { foo: "abc\ndef\n\nghi" });
		this.assertCompiled("1", "{$foo|count_paragraphs}", { foo: "" });
	},
	testPipeDateFormat: function () {
		this.assertCompiled("2009-02-14 08:31:30",
			"{$foo|date_format:'%Y-%m-%d %H:%M:%S'}", { foo: 1234567890 })
	},
	testPipeDefault: function () {
		this.assertCompiled("abc", "{$foo|default:'abc'}");
		this.assertCompiled("abc", "{$foo|default:'abc'}", { foo: "" });
		this.assertCompiled("abc", "{$foo|default:'abc'}", { foo: null });
		this.assertCompiled("abc", "{$foo|default:'def'}", { foo: "abc" });
		this.assertCompiled("0", "{$foo|default:'def'}", { foo: 0 });
	},
	testPipeEscape: function () {
		this.assertCompiled("a&amp;b&quot;c&#039;d&lt;e&gt;f", "{$foo|escape}", { foo: "a&b\"c\'d<e>f" });
		this.assertCompiled("a%2Fb%3Fc%26d%23e%3Df", "{$foo|escape:url}", { foo: "a/b?c&d#e=f" });
		this.assertCompiled("a\\\"b\\\'c\\\\d\\re\\nf<\\/g", "{$foo|escape:javascript}", { foo: "a\"b'c\\d\re\nf</g" });
	},
	testPipeNl2br: function () {
		this.assertCompiled("abc<br />def<br /><br />ghi", "{$foo|nl2br}", { foo: "abc\ndef\n\nghi" });
	},
	testPipeRegexReplace: function () {
		this.assertCompiled("abc def ghi jkl", "{$foo|regex_replace:'/[\\r\\t\\n]/':' '}", { foo: "abc\ndef\rghi\tjkl" });
		this.assertCompiled("abcdefghi", "{$foo|regex_replace:'/(...)(...)(...)/':'$3$1$2'}", { foo: "defghiabc" });
	},
	testPipeReplace: function () {
		this.assertCompiled("abcdefghi", "{$foo|replace:'***':'def'}", { foo: "abc***ghi" });
	},
	testPipeSpacify: function () {
		this.assertCompiled("a_b_c_ _d_e_f", "{$foo|spacify:'_'}", { foo: "abc def" });
		this.assertCompiled("a--b--\n--c--d", "{$foo|spacify:'--'}", { foo: "ab\ncd" });
	},
	testPipeStrip: function () {
		this.assertCompiled(" a b c ", "{$foo|strip}", { foo: "   \t a  b   c \n   " });
		this.assertCompiled("a-b-c", "{$foo|strip:'-'}", { foo: "a    b   c" });
		this.assertCompiled("abc", "{$foo|strip:''}", { foo: "a    b   c" });
	},
	testPipeTruncate: function () {
		this.assertCompiled("abc---", "{$foo|truncate:6:'---':true}", { foo: "abcdefghi" });
		this.assertCompiled("ab..hi", "{$foo|truncate:6:'..':true:true}", { foo: "abcdefghi" });
	},
	testChainedPipes: function () {
		this.assertCompiled("HELLO, world!", "{$foo|strip:''|upper|cat:', world!'}", { foo: "   hello   " });
	},

	testIfWithLiteralValue: function () {
		this.assertCompiled("abc", "{if true}abc{/if}");
		this.assertCompiled("", "{if false}abc{/if}");
		this.assertCompiled("abc", "{if true}abc{else}def{/if}");
		this.assertCompiled("def", "{if false}abc{else}def{/if}");
		this.assertCompiled("abc", "{if 1}abc{else}def{/if}");
		this.assertCompiled("def", "{if 0}abc{else}def{/if}");
		this.assertCompiled("def", "{if null}abc{else}def{/if}");
		this.assertCompiled("def", "{if undefined}abc{else}def{/if}");
		this.assertCompiled("abc", "{if 'hoge'}abc{else}def{/if}");
		this.assertCompiled("def", "{if ''}abc{else}def{/if}");
	},
	testIfWithVariable: function () {
		this.assertCompiled("abc", "{if $foo}abc{/if}", { foo: true });
		this.assertCompiled("", "{if $foo}abc{/if}", { foo: false });
		this.assertCompiled("", "{if $foo}abc{/if}", { foo: null });
		this.assertCompiled("abc", "{if $foo.bar()[baz]}abc{/if}", { foo: { bar: function (){ return { baz: "abc" } } } });
	},
	testIfAnd: function () {
		this.assertCompiled("abc", "{if $foo && $bar}abc{else}def{/if}", { foo: true, bar: true });
		this.assertCompiled("def", "{if $foo && $bar}abc{else}def{/if}", { foo: true, bar: false });
		this.assertCompiled("def", "{if $foo && $bar}abc{else}def{/if}", { foo: false, bar: true });
		this.assertCompiled("def", "{if $foo && $bar}abc{else}def{/if}", { foo: false, bar: false });
		this.assertCompiled("abc", "{if $foo and $bar}abc{else}def{/if}", { foo: true, bar: true });
	},
	testIfOr: function () {
		this.assertCompiled("abc", "{if $foo || $bar}abc{else}def{/if}", { foo: true, bar: true });
		this.assertCompiled("abc", "{if $foo || $bar}abc{else}def{/if}", { foo: true, bar: false });
		this.assertCompiled("abc", "{if $foo || $bar}abc{else}def{/if}", { foo: false, bar: true });
		this.assertCompiled("def", "{if $foo || $bar}abc{else}def{/if}", { foo: false, bar: false });
		this.assertCompiled("abc", "{if $foo or $bar}abc{else}def{/if}", { foo: true, bar: true });
	},
	testIfNot: function () {
		this.assertCompiled("abc", "{if !false}abc{else}def{/if}");
		this.assertCompiled("abc", "{if not false}abc{else}def{/if}");
		this.assertCompiled("def", "{if !true}abc{else}def{/if}");
		this.assertCompiled("def", "{if not true}abc{else}def{/if}");
		this.assertCompiled("def", "{if !$foo}abc{else}def{/if}", { foo: true });
	},
	testIfEqual: function () {
		this.assertCompiled("abc", "{if $foo == 123}abc{/if}", { foo: 123 });
		this.assertCompiled("abc", "{if $foo == 'hoge'}abc{/if}", { foo: "hoge" });
		this.assertCompiled("abc", "{if $foo == $bar}abc{/if}", { foo: 123, bar: 123 });
		this.assertCompiled("", "{if $foo == 456}abc{/if}", { foo: 123 });
		this.assertCompiled("abc", "{if $foo == 123 && $bar == 456}abc{/if}", { foo: 123, bar: 456 });
	},
	testIfNotEqual: function () {
		this.assertCompiled("", "{if $foo != 123}abc{/if}", { foo: 123 });
		this.assertCompiled("", "{if $foo != 'hoge'}abc{/if}", { foo: "hoge" });
		this.assertCompiled("", "{if $foo != $bar}abc{/if}", { foo: 123, bar: 123 });
		this.assertCompiled("abc", "{if $foo != 456}abc{/if}", { foo: 123 });
		this.assertCompiled("", "{if $foo != 123 && $bar != 456}abc{/if}", { foo: 123, bar: 456 });
		this.assertCompiled("abc", "{if $foo != 123 || $bar != 456}abc{/if}", { foo: 123, bar: 789 });
	},
	testIfGreaterThan: function () {
		this.assertCompiled("abc", "{if $foo > 123}abc{/if}", { foo: 200 });
		this.assertCompiled("", "{if $foo > 123}abc{/if}", { foo: 100 });
		this.assertCompiled("", "{if $foo > 123}abc{/if}", { foo: 123 });
		this.assertCompiled("abc", "{if $foo > $bar}abc{/if}", { foo: 123, bar: 100 });
		this.assertCompiled("abc", "{if $foo > 123 && $bar > 456}abc{/if}", { foo: 200, bar: 500 });
	},
	testIfGreaterThanOrEqual: function () {
		this.assertCompiled("abc", "{if $foo >= 123}abc{/if}", { foo: 200 });
		this.assertCompiled("", "{if $foo >= 123}abc{/if}", { foo: 100 });
		this.assertCompiled("abc", "{if $foo >= 123}abc{/if}", { foo: 123 });
		this.assertCompiled("abc", "{if $foo >= $bar}abc{/if}", { foo: 123, bar: 100 });
	},
	testIfLessThan: function () {
		this.assertCompiled("", "{if $foo < 123}abc{/if}", { foo: 200 });
		this.assertCompiled("abc", "{if $foo < 123}abc{/if}", { foo: 100 });
		this.assertCompiled("", "{if $foo < 123}abc{/if}", { foo: 123 });
		this.assertCompiled("", "{if $foo < $bar}abc{/if}", { foo: 123, bar: 100 });
		this.assertCompiled("", "{if $foo < 123 && $bar < 456}abc{/if}", { foo: 200, bar: 500 });
	},
	testIfLessThanOrEqual: function () {
		this.assertCompiled("", "{if $foo <= 123}abc{/if}", { foo: 200 });
		this.assertCompiled("abc", "{if $foo <= 123}abc{/if}", { foo: 100 });
		this.assertCompiled("abc", "{if $foo <= 123}abc{/if}", { foo: 123 });
		this.assertCompiled("", "{if $foo <= $bar}abc{/if}", { foo: 123, bar: 100 });
	},
	testIfMaths: function () {
		this.assertCompiled("abc", "{if $foo == 1 + 2}abc{/if}", { foo: 3 });
		this.assertCompiled("abc", "{if $foo - 1 == 2}abc{/if}", { foo: 3 });
		this.assertCompiled("abc", "{if $foo * 2 == 6}abc{/if}", { foo: 3 });
		this.assertCompiled("abc", "{if $foo / 3 == 1}abc{/if}", { foo: 3 });
		this.assertCompiled("abc", "{if $foo % 3 == 0}abc{/if}", { foo: 3 });
	},
	testElseIf: function () {
		this.assertCompiled("def", "{if false}abc{elseif true}def{else}ghi{/if}");
		this.assertCompiled("ghi", "{if false}abc{elseif false}def{else}ghi{/if}");
		this.assertCompiled("def", "{if $foo}abc{elseif $bar}def{else}ghi{/if}", { foo: false, bar: true });
	},
	testIfWithComplicatedCondition: function () {
		this.assertCompiled("abc", "{if ($foo and $bar) or $baz}abc{else}def{/if}", { foo: false, bar: true, baz: true });
		this.assertCompiled("def", "{if $foo and ($bar or $baz)}abc{else}def{/if}", { foo: false, bar: true, baz: true });
	},
	testNestedIf: function () {
		this.assertCompiled("abc", "{if $foo}{if $bar}{if $baz}abc{/if}{/if}{/if}", { foo: true, bar: true, baz: true });
		this.assertCompiled("", "{if $foo}{if $bar}{if $baz}abc{/if}{/if}{/if}", { foo: true, bar: false, baz: true });
		this.assertCompiled("def", "{if $foo}abc{else}{if $bar}def{/if}{/if}", { foo: false, bar: true });
	},
	testIfUnclosedFails: function () {
		this.assertRaise("SyntaxError", function () {
			Jarty.compile("{if true}abc");
		});
	},

	testForeachWithArray: function () {
		this.assertCompiled("abc", "{foreach from=$foo item=bar}{$bar}{/foreach}", { foo: ["a", "b", "c"] });
	},
	testForeachWithObject: function () {
		this.assertCompiled("a1b2c3", "{foreach from=$foo key=k item=v}{$k}{$v}{/foreach}", { foo: { "a": 1, "b": 2, "c": 3 } });
	},
	testNestedForeach: function () {
		this.assertCompiled("123456789", "{foreach from=$foo item=bar}{foreach from=$bar item=baz}{$baz}{/foreach}{/foreach}",
			{ foo: [ [1,2,3], {a:4,b:5,c:6}, [7,8,9] ] });
	},
	testForeachElse: function () {
		this.assertCompiled("abc", "{foreach from=$foo item=bar}{$bar}{foreachelse}abc{/foreach}", { foo: [] });
	},
	testNamedForeach: function () {
		this.assertCompiled("a:01,b:12,c:23*",
			"{foreach name=hoge from=$foo item=v}" +
				"{if !$jarty.foreach.hoge.first},{/if}" +
				"{$v}:{$jarty.foreach.hoge.index}{$jarty.foreach.hoge.iteration}" +
				"{if $jarty.foreach.hoge.last}*{/if}" +
			"{/foreach}",
			{ foo: [ "a", "b", "c" ] });
	},

	testForFromTo: function () {
		this.assertCompiled("123", "{for from=1 to=3 item=count}{$count}{/for}");
		this.assertCompiled("456", "{for from=$foo to=$bar item=count}{$count}{/for}", { foo: 4, bar: 6 });
		this.assertCompiled("", "{for from=3 to=1 item=count}{$count}{/for}");
	},
	testForFromToStep: function () {
		this.assertCompiled("147", "{for from=1 to=7 step=3 item=count}{$count}{/for}");
		this.assertCompiled("321", "{for from=$foo to=$bar step=-1 item=count}{$count}{/for}", { foo: 3, bar: 1 });
	},
	testForStepZeroFails: function () {
		this.assertRaise("EvalError", function () {
			var compiled = Jarty.compile("{for to=3 step=0 item=count}{$count}{/for}");
			compiled();
		});
	},
	testForElse: function () {
		this.assertCompiled("abc", "{for from=1 to=0 item=count}{$count}{forelse}abc{/for}");
	},
	testNestedFor: function () {
		this.assertCompiled("19,18,17,29,28,27,39,38,37,", "{for from=1 to=3 item=a}{for from=9 to=7 step=-1 item=b}{$a}{$b},{/for}{/for}");
	},

	testFunctionLdelim: function () {
		this.assertCompiled("{", "{ldelim}");
	},
	testFunctionRdelim: function () {
		this.assertCompiled("}", "{rdelim}");
	},
	testFunctionAssign: function () {
		this.assertCompiled("abc", "{assign var='foo' value='abc'}{$foo}");
	},
	testFunctionCapture: function () {
		this.assertCompiled("abc", "{capture}{$foo}{/capture}{$jarty.capture.default}", { foo: "abc" });
		this.assertCompiled("abc", "{capture name=foo}abc{/capture}{$jarty.capture.foo}");
		this.assertCompiled("abc", "{capture assign=foo}abc{/capture}{$foo}");
		this.assertCompiled("abcdef+def", "{capture name=foo assign=foo}abc{capture name=bar assign=bar}def{/capture}{/capture}{$foo}+{$bar}");
	},
	testFunctionStrip: function () {
		this.assertCompiled("abcd e fghi", "{strip}   \n  abc  \n\t  d e f  \r\n  ghi  {/strip}");
		this.assertCompiled("abcdef", "{strip}  {$foo}  {/strip}", { foo: "abc\ndef" });
	},
	testFunctionStripInCapture: function () {
		this.assertCompiled("  foo  abcd e fghi  bar  ", "{capture}  foo  {strip}   \n  abc  \n\t  d e f  \r\n  ghi  {/strip}  bar  {/capture}{$jarty.capture.default}");
	},
	testFunctionCaptureInStripFails: function () {
		this.assertRaise("EvalError", function () {
			var compiled = Jarty.compile("{strip}{capture} \n abc \n d e f \n ghi {/capture}{/strip}");
			compiled();
		});
	},
	testFunctionMath: function () {
		this.assertCompiled("3", "{math equation='1 + 2'}");
		this.assertCompiled("3", "{math equation='x + y' x=1 y=2}");
		this.assertCompiled("3", "{math equation='min(x, y)' x=5 y=3}");
		this.assertCompiled("0.1", "{math equation='pow(x, cos(PI))' x=10 assign=foo}{$foo}");
	},
	testFunctionCounter: function () {
		this.assertCompiled("1,2,3", "{counter},{counter},{counter}");
		this.assertCompiled("3,2,1", "{counter start=3 direction='down'},{counter},{counter}");
		this.assertCompiled("1,2,3", "{counter print=false assign='x'}{$x},{counter print=false assign='x'}{$x},{counter print=false assign='x'}{$x}");
		this.assertCompiled("1,1,2,2,3,3",
			"{counter name='a'},{counter name='b'},{counter name='a'},{counter name='b'},{counter name='a'},{counter name='b'}");
	},

	testGlobals: function () {
		Jarty.globals({ foo: 123, bar: 456 });
		this.assertCompiled("abc,456,def", "{$foo},{$bar},{$baz}", { foo: "abc", baz: "def" });
		this.assertCompiled("123,456,def", "{$foo},{$bar},{$baz}", { baz: "def" });
	},
	testClearGlobals: function () {
		Jarty.globals({ foo: 123, bar: 456 });
		Jarty.clearGlobals();
		this.assertCompiled("abc,,def", "{$foo},{$bar},{$baz}", { foo: "abc", baz: "def" });
	},
	testRemoveGlobal: function () {
		Jarty.globals({ foo: 123, bar: 456 });
		Jarty.removeGlobal("foo");
		this.assertCompiled(",456,def", "{$foo},{$bar},{$baz}", { baz: "def" });
	}

});

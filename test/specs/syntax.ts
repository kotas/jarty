/// <reference path="../../definitions/mocha/mocha.d.ts" />
/// <reference path="../../definitions/chai/chai.d.ts" />
/// <reference path="../../compiled/jarty.d.ts" />
/// <reference path="../helper/mocha_jarty.ts" />

module spec {
    var expect = chai.expect;

    describe('Jarty Syntax', () => {

        describe('{* comments *}', () => {
            it('will be skipped', () => {
                expect(render("{* foo *}")).to.equal("");
                expect(render("{* foo *}abc{* bar *}")).to.equal("abc");
            });
        });

        describe('{literal}', () => {
            it('skips parsing tags', () => {
                expect(render("{literal}{abc}{/literal}")).to.equal("{abc}");
            });
            it('skips parsing variables', () => {
                expect(render("{literal}{$foo}{/literal}")).to.equal("{$foo}");
            });
            it('skips parsing comments', () => {
                expect(render("{literal}{* foo *}{/literal}")).to.equal("{* foo *}");
            });
        });

        describe('{javascript}', () => {
            it('writes JavaScript source as-is', () => {
                expect(render("{javascript} /* foobar */ r.write('test'); {/javascript}")).to.equal("test");
            });
        });

        describe('{$variable}', () => {
            it('embeds a variable', () => {
                expect(render("{$foo}", { foo: "abc" })).to.equal("abc");
                expect(render("{$foo}{$bar}", { foo: "abc", bar: "def" })).to.equal("abcdef");
                expect(render("123{$foo}456{$bar}789", { foo: "abc", bar: "def" })).to.equal("123abc456def789");
            });

            it('skips an undefined variable', () => {
                expect(render("a{$foo}b{$bar}c", {})).to.equal("abc");
            });

            it('skips null reference', () => {
                expect(render("a{$foo}b{$bar}c", { foo: null, bar: null })).to.equal("abc");
            });
        });

        describe('{$variable.property}', () => {
            it('embeds a property of a variable', () => {
                expect(render("{$foo.bar}", { foo: { bar: "abc" } })).to.equal("abc");
                expect(render("{$foo.bar.baz}", { foo: { bar: { baz: "abc" } } })).to.equal("abc");
            });

            it('skips an undefined property', () => {
                expect(render("a{$foo.bar}b", { foo: {} })).to.equal("ab");
            });

            it('never access to a property through null variable', () => {
                expect(render("a{$foo.bar}b", { foo: null })).to.equal("ab");
            });
        });

        describe('{$variable.$ref}', () => {
            it('embeds a property referenced by another variable', () => {
                expect(render("{$foo.$bar}",
                    {
                        foo: { spam: "abc" },
                        bar: "spam"
                    }
                )).to.equal("abc");

                expect(render("{$foo.$bar.$baz}",
                    {
                        foo: { spam: { ham: "abc" } },
                        bar: "spam",
                        baz: "ham"
                    }
                )).to.equal("abc");
            });
        });

        describe('{$variable->property}', () => {
            it('embeds a property of a variable', () => {
                expect(render("{$foo->bar}", { foo: { bar: "abc" } })).to.equal("abc");
                expect(render("{$foo->bar->baz}", { foo: { bar: { baz: "abc" } } })).to.equal("abc");
            });
        });

        describe('{$variable->$ref}', () => {
            it('embeds a property referenced by another variable', () => {
                expect(render("{$foo->$bar}",
                    {
                        foo: { spam: "abc" },
                        bar: "spam"
                    }
                )).to.equal("abc");

                expect(render("{$foo->$bar->$baz}",
                    {
                        foo: { spam: { ham: "abc" } },
                        bar: "spam",
                        baz: "ham"
                    }
                )).to.equal("abc");
            });
        });

        describe('{$variable[property]}', () => {
            it('embeds a property of a variable specified by bare word', () => {
                expect(render("{$foo[bar]}", { foo: { bar: "abc" } })).to.equal("abc");
                expect(render("{$foo[bar][baz]}", { foo: { bar: { baz: "abc" } } })).to.equal("abc");
            });

            it('embeds a property of a variable specified by literal number', () => {
                expect(render("{$foo[123]}", { foo: { 123: "abc" } })).to.equal("abc");
                expect(render("{$foo[123.45]}", { foo: { "123.45": "abc" } })).to.equal("abc");
            });

            it('embeds a property of a variable specified by literal string', () => {
                expect(render("{$foo['bar']}", { foo: { bar: "abc" } })).to.equal("abc");
                expect(render("{$foo[\"bar\"]['baz']}", { foo: { bar: { baz: "abc" } } })).to.equal("abc");
                expect(render('{$foo["\\\\bar\\"baz\\"\\nqux"]}', { foo: { '\\\\bar\\"baz\\"\\nqux': 'abc' } })).to.equal("abc");
            });
        });

        describe('{$variable[$ref]}', () => {
            it('embeds a property referenced by another variable', () => {
                expect(render("{$foo[$bar]}",
                    {
                        foo: { spam: "abc" },
                        bar: "spam"
                    }
                )).to.equal("abc");

                expect(render("{$foo[$bar][$baz]}",
                    {
                        foo: { spam: { ham: "abc" } },
                        bar: "spam",
                        baz: "ham"
                    }
                )).to.equal("abc");
            });
        });

        describe('{$variable[$another[nested]]}', () => {
            it('embeds a property of a variable specified by another variable with suffix', () => {
                expect(render("{$foo[$bar[baz]]}",
                    {
                        foo: { spam: "abc" },
                        bar: { baz: "spam" }
                    }
                )).to.equal("abc");
            });

            it('cannot be double-nested', () => {
                expect(() => {
                    render("{$foo[$bar[$baz[qux]]]}",
                        {
                            foo: { spam: "abc" },
                            bar: { ham: "spam" },
                            baz: { qux: "ham" }
                        }
                    );
                }).to.throw(Jarty.SyntaxError);
            });
        });

        describe('{"string"}', () => {
            it('embed a string as-is', () => {
                expect(render('{"abc"}')).to.equal("abc");
            });
        });

        describe('{123}', () => {
            it('embed an integer as-is', () => {
                expect(render('{123}')).to.equal("123");
            });
            it('embed a float as-is', () => {
                expect(render('{123.45}')).to.equal("123.45");
            });
        });

        describe('{value|pipe}', () => {
            it('passes a variable through pipe', () => {
                expect(render("{$foo|upper}", { foo: "abc" })).to.equal("ABC");
            });

            it('passes a literal string through pipe', () => {
                expect(render("{'abc'|upper}")).to.equal("ABC");
                expect(render("{\"abc\"|upper}")).to.equal("ABC");
            });

            it('passes a literal number through pipe', () => {
                expect(render("{123|upper}")).to.equal("123");
            });

            it('passes a variable with parameters through pipe', () => {
                expect(render("{$foo|cat:'def'}", { foo: "abc" })).to.equal("abcdef");
            });

            it('passes a variable through chained pipes', () => {
                expect(render("{$foo|cat:$bar|upper}", { foo: "abc", bar: "def" })).to.equal("ABCDEF");
            });
        });

        describe('{ldelim}', () => {
            it('prints the left delimiter `{`', () => {
                expect(render("{ldelim}")).to.equal("{");
            });
        });

    });
}

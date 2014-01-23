/// <reference path="../spec_helper.ts" />

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

    describe('{rdelim}', () => {
        it('prints the right delimiter `}`', () => {
            expect(render("{rdelim}")).to.equal("}");
        });
    });

    describe('{foreach}', () => {
        it('iterates over an array', () => {
            expect(render("{foreach from=$items item=foo}{$foo},{/foreach}", { items: [1, 2, 3] })).to.equal("1,2,3,");
        });

        it('iterates over a hash', () => {
            var result = render("{foreach from=$items item=v key=k}{$k}={$v},{/foreach}", { items: { a: 1, b: 2, c: 3 } });
            expect(result).to.match(/^(a=1,|b=2,|c=3,){3}$/);
            expect(result).to.match(/a=1,/);
            expect(result).to.match(/b=2,/);
            expect(result).to.match(/c=3,/);
        });

        it('does nothing on an empty array', () => {
            expect(render("{foreach from=$items item=foo}{$foo},{/foreach}", { items: [] })).to.equal("");
        });

        it('calls foreachelse block for an empty array', () => {
            expect(render("{foreach from=$items item=foo}{$foo},{foreachelse}ok{/foreach}", { items: [] })).to.equal("ok");
        });

        context('when `name` is set', () => {
            function renderForeach(block:string):string {
                return render("{foreach from=$items item=item name=it}" + block + "{/foreach}", { items: ["a", "b", "c"] });
            }

            it('exposes `$jarty.foreach.name.first`; whether the item is first one', () => {
                expect(renderForeach("{if $jarty.foreach.it.first}{$item}{/if}")).to.equal("a");
            });

            it('exposes `$jarty.foreach.name.last`; whether the item is last one', () => {
                expect(renderForeach("{if $jarty.foreach.it.last}{$item}{/if}")).to.equal("c");
            });

            it('exposes `$jarty.foreach.name.total`; the number of items', () => {
                expect(renderForeach("{$jarty.foreach.it.total}")).to.equal("333");
            });

            it('exposes `$jarty.foreach.name.total` properly for a hash', () => {
                var source = "{foreach from=$items item=item name=it}{$jarty.foreach.it.total}{/foreach}";
                expect(render(source, { items: { a: 1, b: 2, c: 3 } })).to.equal("333");
            });

            it('exposes `$jarty.foreach.name.index`; the 0-origin index of item', () => {
                expect(renderForeach("{$jarty.foreach.it.index}")).to.equal("012");
            });

            it('exposes `$jarty.foreach.name.iteration`; the 1-origin number of iteration', () => {
                expect(renderForeach("{$jarty.foreach.it.iteration}")).to.equal("123");
            });

            it('exposes `$jarty.foreach.name.show`; whether any iteration happened', () => {
                var source = "{foreach from=$items item=item name=it}{/foreach}{if $jarty.foreach.it.show}shown{/if}";
                expect(render(source, { items: [1] })).to.equal("shown");
                expect(render(source, { items: [] })).to.equal("");
            });
        });
    });

});

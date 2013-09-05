/// <reference path="../definitions/mocha/mocha.d.ts" />
/// <reference path="../definitions/chai/chai.d.ts" />
/// <reference path="../compiled/jarty.d.ts" />

module spec {
    var expect = chai.expect;

    describe('Jarty Syntax', () => {
        function render(source: any, dict?: Object): string {
            return Jarty.compile(source)(dict);
        }

        describe('{* comments *}', () => {
            it('should be skipped', () => {
                expect(render("{* foo *}")).to.equal("");
                expect(render("{* foo *}abc{* bar *}")).to.equal("abc");
            });
        });

        describe('{literal}', () => {
            it('should ignore tags', () => {
                expect(render("{literal}{abc}{/literal}")).to.equal("{abc}");
            });
        });

        describe('{javascript}', () => {
            it('should output JavaScript source as-is', () => {
                expect(render("{javascript} /* foobar */ r.write('test'); {/javascript}")).to.equal("test");
            });
        });

        describe('{$variable}', () => {
            it('should embed a variable', () => {
                expect(render("{$foo}", { foo: "abc" })).to.equal("abc");
                expect(render("{$foo}{$bar}", { foo: "abc", bar: "def" })).to.equal("abcdef");
                expect(render("123{$foo}456{$bar}789", { foo: "abc", bar: "def" })).to.equal("123abc456def789");
            });

            it('should skip undefined variable', () => {
                expect(render("a{$foo}b{$bar}c", {})).to.equal("abc");
            });

            it('should skip null reference', () => {
                expect(render("a{$foo}b{$bar}c", { foo: null, bar: null })).to.equal("abc");
            });

            it('can embed its property with dots', () => {
                expect(render("{$foo.bar}", { foo: { bar: "abc" } })).to.equal("abc");
                expect(render("{$foo.bar.baz}", { foo: { bar: { baz: "abc" } } })).to.equal("abc");
            });

            it('can embed its property with dots using variables', () => {
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

            it('can embed its property with cursors', () => {
                expect(render("{$foo->bar}", { foo: { bar: "abc" } })).to.equal("abc");
                expect(render("{$foo->bar->baz}", { foo: { bar: { baz: "abc" } } })).to.equal("abc");
            });

            it('can embed its property with cursors using variables', () => {
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

            it('can embed its property with indexers', () => {
                expect(render("{$foo[bar]}", { foo: { bar: "abc" } })).to.equal("abc");
                expect(render("{$foo[bar][baz]}", { foo: { bar: { baz: "abc" } } })).to.equal("abc");
            });

            it('can embed its property with indexers using literal number', () => {
                expect(render("{$foo[123]}", { foo: { 123: "abc" } })).to.equal("abc");
                expect(render("{$foo[123.45]}", { foo: { "123.45": "abc" } })).to.equal("abc");
            });

            it('can embed its property with indexers using literal string', () => {
                expect(render("{$foo['bar']}", { foo: { bar: "abc" } })).to.equal("abc");
                expect(render("{$foo[\"bar\"]['baz']}", { foo: { bar: { baz: "abc" } } })).to.equal("abc");
                expect(render('{$foo["\\\\bar\\"baz\\"\\nqux"]}', { foo: { '\\\\bar\\"baz\\"\\nqux': 'abc' } })).to.equal("abc");
            });

            it('can embed its property with indexers using variables', () => {
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

            it('can embed its property with nested indexers', () => {
                expect(render("{$foo[$bar[baz]]}",
                    {
                        foo: { spam: "abc" },
                        bar: { baz: "spam" }
                    }
                )).to.equal("abc");
            });

            it('cannot embed its property with double-nested indexers', () => {
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

            it('never access to property of null reference', () => {
                expect(render("{$foo.bar}", {})).to.equal("");
                expect(render("{$foo.bar.baz}", {})).to.equal("");
                expect(render("{$foo.bar.baz}", { foo: {} })).to.equal("");
            });

        });

    });
}

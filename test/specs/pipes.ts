/// <reference path="../../definitions/mocha/mocha.d.ts" />
/// <reference path="../../definitions/chai/chai.d.ts" />
/// <reference path="../../compiled/jarty.d.ts" />
/// <reference path="../helper/mocha_jarty.ts" />

module spec {
    var expect = chai.expect;

    describe('Jarty Pipes', () => {

        describe('default', () => {
            it('passes the non-null value through', () => {
                expect(render("{$foo|default:'def'}", { foo: "abc" })).to.equal("abc");
            });

            it('returns the parameter instead of the null value', () => {
                expect(render("{$foo|default:'def'}", { foo: null })).to.equal("def");
            });

            it('returns the parameter instead of the undefined value', () => {
                expect(render("{$foo|default:'def'}", {})).to.equal("def");
            });

            it('returns the parameter instead of the empty string', () => {
                expect(render("{$foo|default:'def'}", { foo: "" })).to.equal("def");
            });
        });

        describe('cat', () => {
            it('concatenates two values', () => {
                expect(render("{$foo|cat:'def'}", { foo: "abc" })).to.equal("abcdef");
            });

            it('always treats the values as string', () => {
                expect(render("{123|cat:45}")).to.equal("12345");
            });
        });

        describe('lower', () => {
            it('converts the value to lower-case', () => {
                expect(render("{$foo|lower}", { foo: "ABCdef" })).to.equal("abcdef");
            });
        });

        describe('upper', () => {
            it('converts the value to upper-case', () => {
                expect(render("{$foo|upper}", { foo: "ABCdef" })).to.equal("ABCDEF");
            });
        });

        describe('count_characters', () => {
            context('including whitespace', () => {
                it('counts the number of characters in the value', () => {
                    expect(render("{$foo|count_characters:true}", { foo: "abc def ghi" })).to.equal("11");
                });
            });
            context('not including whitespace', () => {
                it('counts the number of characters without whitespaces in the value', () => {
                    expect(render("{$foo|count_characters}", { foo: "abc def\tghi\njkl" })).to.equal("12");
                });
            });
        });

        describe('count_paragraphs', () => {
            it('counts the number of paragraphs in the value', () => {
                expect(render("{$foo|count_paragraphs}", { foo: "abc\ndef\n\nghi" })).to.equal("3");
            });

            it('returns 1 for the string not containing any line-breaks', () => {
                expect(render("{$foo|count_paragraphs}", { foo: "abc" })).to.equal("1");
            });

            it('does not count empty paragraphs', () => {
                expect(render("{$foo|count_paragraphs}", { foo: "abc\n\n\n\ndef" })).to.equal("2");
            });
        });

        describe('count_sentences', () => {
            it('counts the number of sentences in the value', () => {
                expect(render("{$foo|count_sentences}", { foo: "abc. def." })).to.equal("2");
            });

            it('returns 0 for the string not a sentence', () => {
                expect(render("{$foo|count_sentences}", { foo: "abcdef" })).to.equal("0");
            });
        });

        describe('count_words', () => {
            it('counts the number of words in the value', () => {
                expect(render("{$foo|count_words}", { foo: "foo bar 123 baz." })).to.equal("4");
            });

            it('returns 0 for an empty string', () => {
                expect(render("{$foo|count_words}", { foo: "" })).to.equal("0");
            });
        });

        describe('nl2br', () => {
            it('converts line-breaks into <br /> tags', () => {
                expect(render("{$foo|nl2br}", { foo: "abc\ndef\nghi" })).to.equal("abc<br />def<br />ghi");
            });
        });

        describe('regex_replace', () => {
            it('replaces the string to new one by regular expression', () => {
                expect(render("{$foo|regex_replace:'/[abc]+/':'oo'}", { foo: "faabbccgabcabc" })).to.equal("foogoo");
            });

            it('throws a RuntimeError if the regular expression is invalid', () => {
                expect(() => {
                    render("{$foo|regex_replace:'/)bad(/':''}", { foo: "bad" });
                }).to.throw(Jarty.RuntimeError);
            });
        });

    });

}

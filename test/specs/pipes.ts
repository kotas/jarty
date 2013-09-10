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
                expect(render("{$foo|count_paragraphs}", { foo: "abc\n\ndef\n\nghi" })).to.equal("3");
            });

            it('returns 1 for the string not containing any line-breaks', () => {
                expect(render("{$foo|count_paragraphs}", { foo: "abc" })).to.equal("1");
            });

            it('does not count a single line-break as a paragraph', () => {
                expect(render("{$foo|count_paragraphs}", { foo: "abc\ndef\nghi" })).to.equal("1");
            });

            it('does not count empty paragraphs', () => {
                expect(render("{$foo|count_paragraphs}", { foo: "abc\n\n\n\ndef" })).to.equal("2");
            });
        });

    });

}

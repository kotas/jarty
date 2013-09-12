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

        describe('replace', () => {
            it('replaces the string to new one by a static string', () => {
                expect(render("{$foo|replace:'aa':'oo'}", { foo: "faabaaaaabc" })).to.equal("foobooooabc");
            });
        });

        describe('spacify', () => {
            it('adds spaces between characters in the string', () => {
                expect(render("{$foo|spacify}", { foo: "abc" })).to.equal("a b c");
            });

            it('adds the given string between characters in the target string', () => {
                expect(render("{$foo|spacify:'oo'}", { foo: "abc" })).to.equal("aoobooc");
            });
        });

        describe('strip', () => {
            it('replaces whitespace sequences with a space', () => {
                expect(render("{$foo|strip}", { foo: "a     b\nc\t d" })).to.equal("a b c d");
            });

            it('replaces whitespace sequences with the given string', () => {
                expect(render("{$foo|strip:'__'}", { foo: "a     b\nc\t d" })).to.equal("a__b__c__d");
            });
        });

        describe('strip_tags', () => {
            it('replaces tags in a string with a space', () => {
                expect(render("{$foo|strip_tags}", { foo: '<a href="#">ab<s>c</s></a>' })).to.equal(" ab c  ");
            });

            it('removes tags from a string', () => {
                expect(render("{$foo|strip_tags:false}", { foo: '<a href="#">ab<s>c</s></a>' })).to.equal("abc");
            });
        });

        describe('truncate', () => {
            var longText = Array(101).join("a");  // "aaaaa.....aaaaa".length === 100
            var text = "Two Sisters Reunite after Eighteen Years at Checkout Counter.";

            it('truncates a string to 80 characters and adds a trim marker to the end by default', () => {
                expect(render("{$foo|truncate}", { foo: longText })).to.match(/^a{77}\.\.\.$/);
            });

            it('never truncates a string if it is short', () => {
                expect(render("{$foo|truncate}", { foo: text })).to.equal(text);
            });

            it('truncates a string to the given length by word', () => {
                expect(render("{$foo|truncate:30}", { foo: text })).to.equal("Two Sisters Reunite after...");
            });

            it('truncates a string and adds the given string to the end', () => {
                expect(render("{$foo|truncate:30:'---'}", { foo: text })).to.equal("Two Sisters Reunite after---");
            });

            it('truncates a string to the given length by character', () => {
                expect(render("{$foo|truncate:30:'':true}", { foo: text })).to.equal("Two Sisters Reunite after Eigh");
            });

            it('includes the length of a trim marker to the truncate length', () => {
                expect(render("{$foo|truncate:30:'...':true}", { foo: text })).to.equal("Two Sisters Reunite after E...");
            });

            it('omits the middle of the string', () => {
                expect(render("{$foo|truncate:30:'..':true:true}", { foo: text })).to.equal("Two Sisters Re..ckout Counter.");
            });
        });

    });

}

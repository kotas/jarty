/// <reference path="../../definitions/mocha/mocha.d.ts" />
/// <reference path="../../definitions/chai/chai.d.ts" />
/// <reference path="../../compiled/jarty.d.ts" />
/// <reference path="../helper/mocha_jarty.ts" />

module spec {
    var expect = chai.expect;

    describe('Jarty.Compiler', () => {
        var compiler:Jarty.Compiler;

        beforeEach(() => {
            compiler = new Jarty.Compiler();
        });

        describe('#compileToString()', () => {
            it('returns a string', () => {
                expect(compiler.compileToString("")).to.be.a("string");
            });
        });

        describe('#compileToFunction()', () => {
            it('returns a function', () => {
                expect(compiler.compileToFunction("")).to.be.a("function");
            });

            context('when syntax error is met', () => {

                it('throws Jarty.SyntaxError', () => {
                    expect(() => {
                        compiler.compileToFunction("{$ouch...}");
                    }).to.throw(Jarty.SyntaxError);
                });

                it('includes the position of syntax error', () => {
                    try {
                        compiler.compileToFunction("abc\ndef\nghi{$ouch...}jkl\nmno\npqr");
                        throw "SyntaxError not thrown";
                    } catch (e) {
                        expect(e).to.be.instanceof(Jarty.SyntaxError);
                        expect(e).to.have.property("position");
                        expect(e.position.col).to.equal(4);
                        expect(e.position.row).to.equal(3);
                        expect(e.position.line).to.equal("ghi{$ouch...}jkl");
                        expect(e.position.source).to.equal("abc\ndef\nghi{$ouch...}jkl\nmno\npqr");
                    }
                });

            });
        });

        describe('compiled function', () => {
            it('keeps a plain text as-is', () => {
                expect(render("abc")).to.equal("abc");
            });

            it('always returns a string', () => {
                expect(render("")).to.equal("");
                expect(render(null)).to.equal("");
                expect(render(undefined)).to.equal("");
            });
        });
    });
}

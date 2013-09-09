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

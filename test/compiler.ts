/// <reference path="../definitions/mocha/mocha.d.ts" />
/// <reference path="../definitions/chai/chai.d.ts" />
/// <reference path="../compiled/jarty.d.ts" />

module spec {
    var expect = chai.expect;

    describe('Jarty.Compiler', () => {
        var compiler: Jarty.Compiler;

        function compile(source: any, dict?: Object): string {
            return compiler.compileToFunction(source)(dict);
        }

        beforeEach(() => {
            compiler = new Jarty.Compiler();
        });

        describe('#compileToString()', () => {
            it('should return a string', () => {
                expect(compiler.compileToString("")).to.be.a("string");
            });
        });

        describe('#compileToFunction()', () => {
            it('should return a function', () => {
                expect(compiler.compileToFunction("")).to.be.a("function");
            });
        });

        describe('compiled function', () => {
            it('should keep a plain text as-is', () => {
                expect(compile("abc")).to.equal("abc");
            });

            it('should always return a string', () => {
                expect(compile("")).to.equal("");
                expect(compile(null)).to.equal("");
                expect(compile(undefined)).to.equal("");
                expect(compile(123)).to.equal("123");
                expect(compile(123.45)).to.equal("123.45");
            });
        });
    });
}

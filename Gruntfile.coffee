module.exports = (grunt) ->
  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'

    typescript:
      jarty:
        src:  ['compiled/jarty.ts']
        dest: 'compiled/jarty.js'
        options:
          target: 'es3'
          sourcemap: true
          declaration: true
      test:
        src: ['test/**/*.ts']
        dest: 'compiled'
        options:
          target: 'es3'

    tslint:
      options:
        configuration: grunt.file.readJSON 'tslint.json'
      files:
        src: ['src/**/*.ts', 'test/**/*.ts']

    concat:
      jarty:
        src: [
          'src/intro.ts.txt',
          'src/utils.ts',
          'src/exceptions.ts',
          'src/compiler/interfaces.ts',
          'src/compiler/translator.ts',
          'src/compiler/rules.ts',
          'src/compiler/compiler.ts',
          'src/runtime/interfaces.ts',
          'src/runtime/global.ts',
          'src/runtime/functions.ts',
          'src/runtime/runtime.ts',
          'src/jarty.ts',
          'src/outro.ts.txt',
        ]
        dest: 'compiled/jarty.ts'

    uglify:
      dist:
        files:
          'compiled/jarty.min.js': ['compiled/jarty.js']

    watch:
      files: ['src/**/*.ts', 'test/**/*.ts']
      tasks: ['compile']

  grunt.loadNpmTasks 'grunt-typescript'
  grunt.loadNpmTasks 'grunt-tslint'
  grunt.loadNpmTasks 'grunt-contrib-concat'
  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-contrib-watch'

  grunt.registerTask 'lint',    ['tslint']
  grunt.registerTask 'compile', ['lint', 'concat:jarty', 'typescript:jarty', 'typescript:test']
  grunt.registerTask 'default', ['compile']
  grunt.registerTask 'release', ['compile', 'uglify']

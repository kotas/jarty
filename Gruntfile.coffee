module.exports = (grunt) ->
  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'

    typescript:
      jarty:
        src:  ['compiled/jarty.ts']
        dest: 'compiled/jarty.js'
        options:
          sourcemap: true
          declaration: true

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
          'src/runtime/runtime.ts',
          'src/runtime/functions.ts',
          'src/jarty.ts',
          'src/outro.ts.txt',
        ]
        dest: 'compiled/jarty.ts'

    uglify:
      dist:
        files:
          'compiled/jarty.min.js': ['compiled/jarty.js']

    watch:
      files: 'src/**/*.ts',
      tasks: ['compile']

  grunt.loadNpmTasks 'grunt-typescript'
  grunt.loadNpmTasks 'grunt-contrib-concat'
  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-contrib-watch'

  grunt.registerTask 'compile', ['concat:jarty', 'typescript:jarty']
  grunt.registerTask 'default', ['compile']
  grunt.registerTask 'release', ['compile', 'uglify']

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
          'src/intro.ts',
          'src/jarty.ts',
          'src/compiler.ts',
          'src/outro.ts',
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

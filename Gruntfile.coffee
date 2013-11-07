module.exports = (grunt) ->

  grunt.loadNpmTasks 'grunt-typescript'
  grunt.loadNpmTasks 'grunt-contrib-concat'
  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-contrib-clean'
  grunt.loadNpmTasks 'grunt-contrib-watch'

  grunt.registerTask 'compile', ['typescript:test']
  grunt.registerTask 'release', ['typescript:release', 'concat:release', 'uglify:release']
  grunt.registerTask 'default', ['compile']

  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'

    typescript:
      test:
        src:  ['src/**/*.ts', 'test/**/*.ts']
        dest: 'compiled/test-jarty.js'
        options:
          sourcemap: true
      release:
        src:  ['src/**/*.ts']
        dest: 'compiled/jarty.js'

    concat:
      release:
        src: [
          'etc/wrap/intro.js.txt',
          'compiled/jarty.js',
          'etc/wrap/outro.js.txt',
        ]
        dest: 'dist/jarty.js'

    uglify:
      release:
        files:
          'dist/jarty.min.js': ['dist/jarty.js']

    clean:
      compiled:
        src: ['compiled']

    watch:
      files: ['src/**/*.ts', 'test/**/*.ts']
      tasks: ['compile']

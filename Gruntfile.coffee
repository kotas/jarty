module.exports = (grunt) ->

  grunt.initConfig {
    pkg: grunt.file.readJSON('package.json')

    typescript:
      jarty:
        src:  ['src/**/*.ts']
        dest: 'compiled/jarty.js'
        options:
          sourcemap: true
          declaration: true

    uglify:
      dist:
        files:
          'dist/jarty.min.js': ['compiled/jarty.js']

    watch:
      files: 'src/**/*.ts',
      tasks: ['typescript']
  }

  grunt.loadNpmTasks('grunt-typescript')
  grunt.loadNpmTasks('grunt-contrib-uglify')
  grunt.loadNpmTasks('grunt-contrib-watch')

  grunt.registerTask('compile', ['typescript'])

  grunt.registerTask('default', [
    'compile'
    'watch'
  ])

  grunt.registerTask('release', [
    'compile'
    'uglify:dist'
  ])

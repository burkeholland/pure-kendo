module.exports = function(grunt) {

  'use strict';

  // project configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    browserify: {
      'build.js': [ 'js/*.js' ]
    },
    watch: {
      scripts: {
        files: [ 'js/*.js' ],
        tasks: [ 'default' ],
        options: {
          nospawn: true
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', [ 'browserify', 'watch' ]);

};
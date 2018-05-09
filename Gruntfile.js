'use strict';

module.exports = function (grunt) {
  // show elapsed time at the end
  require('time-grunt')(grunt);
  // load all grunt tasks and their config
  require('load-grunt-config')(grunt);

  grunt.registerTask('build', [
    'env:dist',
    'less',
    'browserify',
    'uglify'
  ]);

  grunt.registerTask('default', ['dev']);

  grunt.registerTask('dev', [
    'env:dev',
    'less',
    'eslint',
    'browserify',
    'develop',
    'watch'
  ]);
};

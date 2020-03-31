'use strict';
const DEV_PATH = './source/';
const PUBLIC_PATH = './dist/';
const ROOT_PATH = './';

const
    gulp = require('gulp'),
    browserSync = require('browser-sync').create(),
    //uglify = require('gulp-uglify-es').default,
    //sourcemaps = require('gulp-sourcemaps'),
    //plumber = require('gulp-plumber'), // для отслеживания ошибок
    babel = require('gulp-babel');


// transform js
function jsTransform(fileSrcPath, fileDestPath) {
    return () => {
        return gulp.src(fileSrcPath)
            //.pipe(plumber())
            //.pipe(sourcemaps.init())
            .pipe(babel()) // see .babelrc
            //.pipe(uglify()) // minification
            //.pipe(sourcemaps.write('.'))
            .pipe(gulp.dest(fileDestPath))
            //.pipe(browserSync.stream());
    }
}

gulp.task('js', jsTransform(DEV_PATH + '*.js', PUBLIC_PATH));

gulp.task('build', gulp.series('js'));

function watch() {
    browserSync.init({
        server: {baseDir: './dist/'}
    });
    gulp.watch(DEV_PATH + '*.js', gulp.series('js'));
    gulp.watch(DEV_PATH + '*.js').on('change', browserSync.reload);
    //gulp.watch(PUBLIC_PATH + '*.html').on('change', browserSync.reload);
}

exports.watch = watch;
var gulp = require('gulp'),
    path = require('path'),
    data = require('gulp-data'),
    twig = require('gulp-twig'),
    prefix = require('gulp-autoprefixer'),
    sass = require('gulp-sass'),
    plumber = require('gulp-plumber'),
    concat = require('gulp-concat'),
    sourcemaps = require('gulp-sourcemaps'),
    browserSync = require('browser-sync'),
    fs = require('fs');

var paths = {
    build: './',
    src: './src/',
    sass: './src/scss/',
    css: './assets/css/',
    data: './src/data/',
    js: './assets/js'
};
/**
 * Compile .twig files and pass data from json file
 * matching file name. index.twig - index.twig.json into HTMLs
 */
gulp.task('twig', function () {
    return gulp.src(['./src/templates/*.twig'])
        .pipe(plumber({
            handleError: function (err) {
                console.log(err);
                this.emit('end');
            }
        }))
        .pipe(data(function (file) {
            return JSON.parse(fs.readFileSync(paths.data + path.basename(file.path) + '.json'));
        }))
        .pipe(twig({
            extname: '.php'
        }))
        .on('error', function (err) {
            process.stderr.write(err.message + '\n');
            this.emit('end');
        })
        .pipe(gulp.dest(paths.build));
});
/**
 * Recompile .twig files and live reload the browser
 */
gulp.task('rebuild', gulp.series('twig'), function () {
    // BrowserSync Reload
    browserSync.reload();
});
/**
 * Compile .scss files into build css directory With autoprefixer no
 * need for vendor prefixes then live reload the browser.
 */
gulp.task('sass', function () {
    return gulp.src(paths.sass + '*.scss')
        .pipe(sourcemaps.init())
        // Stay live and reload on error
        .pipe(plumber({
            handleError: function (err) {
                console.log(err);
                this.emit('end');
            }
        }))
        .pipe(
            sass({
                includePaths: [paths.sass],
                outputStyle: 'expanded'
            }).on('error', function (err) {
                console.log(err.message);
                this.emit('end');
            })
        )
        .pipe(prefix(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], {
            cascade: true
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(paths.css));
});
/**
 * Compile .js files into build js directory With app.min.js
 */
gulp.task('js', function () {
    return gulp.src('src/js/*.js')
        .pipe(sourcemaps.init())
        .pipe(gulp.dest('assets/js'))
        .pipe(concat('script.min.js'))
        .on('error', function (err) {
            console.log(err.toString());
            this.emit('end');
        })
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('assets/js'));
});
/**
 * Watch scss files for changes & recompile
 * Watch .twig files run twig-rebuild then reload BrowserSync
 */
gulp.task('watch', function () {
    gulp.watch(paths.src + 'js/**/*.js', gulp.parallel('js', browserSync.reload));
    gulp.watch(paths.sass + '**/*.scss', gulp.parallel('sass', browserSync.reload));
    gulp.watch([
            'src/templates/**/*.twig',
            'src/data/**/*.twig.json'
        ], {
            cwd: './'
        },
        gulp.parallel('rebuild'));
});

/**
 * Wait for twig, js and sass tasks, then launch the browser-sync Server
 */
gulp.task('browser-sync', gulp.parallel('sass', 'twig', 'js'), function () {
    browserSync({
        server: {
            baseDir: paths.build
        },
        notify: false,
        browser: "google chrome"
    });
});

gulp.task('build', gulp.parallel('sass', 'js', 'twig'));
gulp.task('default', gulp.parallel('browser-sync', 'watch'));

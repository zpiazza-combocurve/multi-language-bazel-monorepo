import browserSync from 'browser-sync';
import gulp from 'gulp';
import cleanCSS from 'gulp-clean-css';
import gulpif from 'gulp-if';
import gulpInlineCSS from 'gulp-inline-css';
import gulpSass from 'gulp-sass';
import sourcemaps from 'gulp-sourcemaps';
import nodeSass from 'node-sass';
import nunjucks from 'nunjucks';
import { rimraf } from 'rimraf';
import yargs from 'yargs';
import PluginError from 'plugin-error';
import through from 'through2';
import rename from 'gulp-rename';
import htmlmin from 'gulp-htmlmin';

import templateData from './src/template.json';

const server = browserSync.create();
const PRODUCTION = yargs.argv.prod;

const sass = gulpSass(nodeSass);

nunjucks.installJinjaCompat();

const paths = {
	styles: {
		src: 'src/scss/main.scss',
		dest: 'build/css',
	},
	html: {
		src: 'src/index.html',
		dest: 'build/',
	},
	other: {
		src: 'src/other/**/*',
		dest: 'build',
	},
};

const serve = (done) => {
	server.init({
		server: {
			baseDir: './build',
		},
	});
	done();
};

const reload = (done) => {
	server.reload();
	done();
};

const styles = () => {
	return gulp
		.src(paths.styles.src)
		.pipe(gulpif(!PRODUCTION, sourcemaps.init()))
		.pipe(sass().on('error', sass.logError))
		.pipe(gulpif(PRODUCTION, cleanCSS({ compatibility: '*' })))
		.pipe(gulpif(!PRODUCTION, sourcemaps.write()))
		.pipe(gulp.dest(paths.styles.dest))
		.pipe(server.stream());
};

function compile(data, options = {}) {
	return through.obj(function (file, encoding, callback) {
		if (file.isNull()) {
			callback(null, file);
			return;
		}

		if (file.isStream()) {
			callback(new PluginError('gulp-nunjucks', 'Streaming not supported'));
			return;
		}

		const context = {...data, ...file.data};
		const filePath = file.path;
		const env = options.env || new nunjucks.Environment(new nunjucks.FileSystemLoader(file.base), options);

		let isAsync = false;

		if (options.filters && !options.env) {
			for (const key of Object.keys(options.filters)) {
				const filter = options.filters[key];
				if (is.asyncFunction(filter)) {
					isAsync = true;
					env.addFilter(key, async (...args) => {
						const cb = args.pop();
						try {
							const result = await filter(...args);
							cb(null, result);
						} catch (error) {
							cb(error, null);
						}
					}, true);
				} else {
					env.addFilter(key, filter);
				}
			}
		}

		try {
			const writeResult = result => {
				file.contents = Buffer.from(result);
				file.extname = '.html';
				this.push(file);
			};

			if (isAsync) {
				env.renderString(file.contents.toString(), context, (error, result) => {
					if (error) {
						this.emit('error', new PluginError('gulp-nunjucks', error, {fileName: filePath}));
						callback();
						return;
					}

					writeResult(result);
					callback();
				});
			} else {
				writeResult(env.renderString(file.contents.toString(), context));
				callback();
			}
		} catch (error) {
			this.emit('error', new PluginError('gulp-nunjucks', error, {fileName: filePath}));
			callback();
		}
	});
}

const html = () => {
	return gulp
		.src(paths.html.src)
		.pipe(gulpif(!PRODUCTION, compile(templateData)))
		.pipe(gulp.dest(paths.html.dest));
};

const createTemplate = () => {
	return gulp
		.src(`${paths.html.dest}/index.html`)
		.pipe(gulpInlineCSS())
		.pipe(htmlmin({ collapseWhitespace: true }))
		.pipe(rename({basename: 'template'}))
		.pipe(gulp.dest(paths.html.dest));
}

const other = () => {
	return gulp.src(paths.other.src).pipe(gulp.dest(paths.other.dest));
};

const delBuild = (cb) => {
	rimraf('./build', {});
	cb();
};

export const watch = () => {
	gulp.watch('src/scss/**/*.scss', styles);
	gulp.watch('src/**/**/*.html', gulp.series(html, reload));
	gulp.watch('src/other/**/*', gulp.series(other, reload));
};

export const dev = gulp.series(gulp.parallel(other, styles, html), serve, watch);

export const build = gulp.series(delBuild, styles, html, createTemplate, other);

export default dev;

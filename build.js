const webpack = require('webpack');

/**
 * webpack stuff
 */

console.log("Running webpack compiler...");

const compiler = webpack(require('./webpack.config'));

compiler.run((err, stats) => {
    if (err || stats.hasErrors()) {
        throw err ?? stats.hasErrors;
    }

    console.log(`Finished building ${stats.compilation.outputOptions.uniqueName}`);

    compiler.close(closeErr => {
        if (closeErr) {
            throw closeErr;
        }
    });
});

/**
 * sass
 */

console.log("Rendering SCSS...");

const sass = require('sass');
const { writeFileSync } = require('fs');
const { join } = require('path');

sass.render({file: './src/scss/screen.scss'}, (err, result) => {
    if (err) {
        throw err;
    }
    writeFileSync(join(__dirname, "dist/css/screen.css"), result.css);
    console.log("Finished rendering SCSS");
});

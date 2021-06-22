const webpack = require('webpack');

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

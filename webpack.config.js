const { resolve } = require("path");

module.exports = {
  entry: "./src/index.ts",
  mode: "none",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /sass\/\.s[ac]ss$/i,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    fallback: {
      events: require.resolve("events/"),
    },
  },
  output: {
    filename: "script.js",
    path: resolve(__dirname, "dist/js"),
  },
};

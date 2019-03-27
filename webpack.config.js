const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const webpackMerge = require("webpack-merge");
const PowerbiUmdPlugin = require("./build/PowerbiUmdPlugin");
const TerserPlugin = require("terser-webpack-plugin");

const libraryName = "Shifu";

/**
 * Load the config based on the target ( dev | prod)
 * @param {Object} env - Environment variable
 */
const modeConfig = env => require(`./build/webpack.${env.mode}`)(env);

// Common webpack configuration
const common = {
  entry: "./src/index.ts",
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "babel-loader",
        exclude: [/node_modules/, /test/]
      },
    ]
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  plugins: [
    new DtsBundlePlugin(),
    new webpack.ProgressPlugin(),
    new PowerbiUmdPlugin(),
  ],
  externals: {},
  output: {
    library: libraryName,
    libraryTarget: "umd",
    filename: "index.js",
    path: path.resolve(__dirname, "dist")
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          ecma: undefined,
          warnings: false,
          parse: {},
          compress: {},
          mangle: false, // Note `mangle.properties` is `false` by default.
          module: false,
          output: null,
          toplevel: false,
          nameCache: null,
          ie8: false,
          keep_classnames: undefined,
          keep_fnames: false,
          safari10: false
        }
      })
    ]
  }
};

module.exports = (mode = "production") => {
  return webpackMerge(common, modeConfig(mode));
};

function DtsBundlePlugin() {}
DtsBundlePlugin.prototype.apply = function(compiler) {
  compiler.plugin("done", function() {
    var dts = require("dts-bundle");
    var typeDefPath = path.join(__dirname, "dist/index.d.ts");
    dts.bundle({
      name: libraryName,
      main: typeDefPath,
      out: typeDefPath,
      removeSource: false,
      outputAsModuleFolder: true // to use npm in-package typings
    });

    /**
     * Powerbi does not support import statements yet. Hence, the only way to support types in PowerBi Visual is to
     * have the following statement in the type definition file.
     */
    const text = "export as namespace Shifu;";
    let writeStream = fs.createWriteStream(typeDefPath, {
      flags: "a"
    });
    writeStream.write(text);
    writeStream.end(err => {
      if (err) console.log(err);
      console.log("Type Definition written successfully");
    });
  });
};

const { ConcatSource } = require("webpack-sources");

class PowerbiUmdPlugin {
	constructor(){
		this.pluginName = this.constructor.name;
	}

	powerbiUmd(compiler, compilation) {
		const libraryFile = compiler.options.output.filename;
		compilation.hooks.chunkAsset.tap(
			this.pluginName,
			(chunk, filename) => {
				if(filename === libraryFile) {
					compilation.assets[filename] = new ConcatSource(
						"(function(){\n" +
						"	var window = this;\n",
						compilation.assets[filename],
						"\n})();"			
					);
				}
			}
		)
	}

	apply(compiler) {		
		compiler.hooks.compilation.tap(
			this.pluginName,
			(compilation) => {
				this.powerbiUmd(compiler, compilation);
			}
		);
	}
}

module.exports = PowerbiUmdPlugin;
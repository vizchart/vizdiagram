import { terser } from 'rollup-plugin-terser';

export default {
	input: 'src/index.js',
	output: {
		file: 'dist/index.js',
		format: 'iife',
		sourcemap: false
	},
	plugins: [
		terser({
			compress: {
				drop_console: true,
				drop_debugger: true
			}
		})
	]
}; 
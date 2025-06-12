import replace from '@rollup/plugin-replace';

export default {
	input: 'src/index.js',
	output: {
		file: 'src/bundle.js',
		format: 'iife',
		sourcemap: true
	},
	plugins: [
		replace({ 
			preventAssignment: true, 
			'https://localhost:7156/api': 'https://dgrm.boyko.tech/api' 
		})
	],
	watch: {
		include: 'src/**',
		exclude: 'src/bundle.js'
	}
}; 
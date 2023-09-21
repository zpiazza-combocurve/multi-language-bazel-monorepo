import 'zingchart';

declare module 'zc-inside-petroleum/build/es6/zingchart-es6.min' {
	export default zingchart;
}

declare global {
	namespace zingchart {
		// TODO let zingchart team know these api are missing from their types
		function loadModules(modules: string, cb: (result: void) => void);
	}
}

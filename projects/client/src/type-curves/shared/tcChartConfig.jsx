import { genScaleX } from '../../helpers/zing';

const genTCScaleX = (props) => {
	const config = genScaleX({ xGuide: true, xLogScale: false, ...props });
	config.maxItems = undefined;
	config.stepMultiplier = undefined;
	return config;
};

// const genTCScaleY = () => {};

export { genTCScaleX };

import { useMemo } from 'react';

import TypeCurveFit from './fit/TypeCurveFit';
import { ControlsLayoutContainer } from './layout';
import TypeCurveManual from './manual/TypeCurveManual';
import TypeCurveNormalization from './normalization/TypeCurveNormalization';
import { Mode } from './types';
import TypeCurveView from './view/TypeCurveView';

function ControlsLayout({ mode, ...controlProps }: { mode: Mode }) {
	const controlsRender = useMemo(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const props = controlProps as any;
		switch (mode) {
			case 'view':
				return <TypeCurveView {...props} />;
			case 'manual':
				return <TypeCurveManual {...props} />;
			case 'normalization':
				return <TypeCurveNormalization {...props} />;
			case 'fit':
				return <TypeCurveFit {...props} />;
		}
	}, [controlProps, mode]);

	return <ControlsLayoutContainer>{controlsRender}</ControlsLayoutContainer>;
}

export default ControlsLayout;

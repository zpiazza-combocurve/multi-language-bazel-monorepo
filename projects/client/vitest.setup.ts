import { cleanup } from '@testing-library/react';
import { vi } from 'vitest';

// https://github.com/vitest-dev/vitest/blob/main/examples/react-testing-lib/src/test/setup.ts

import '@testing-library/jest-dom';
import 'jest-styled-components';

vi.hoisted(() => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(global as any).vi = vi;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(global as any).jest = vi;
});

beforeEach(() => {
	cleanup();
});

// https://github.com/clientIO/rappid-tutorial-react/blob/main/src/setupTests.ts
// Mock method which is not implemented in JSDOM
function mockSVG() {
	// @ts-expect-error TODO: Check what is the correct type
	window.SVGAngle = vi.fn();

	Object.defineProperty(global.SVGSVGElement.prototype, 'createSVGMatrix', {
		writable: true,
		value: vi.fn().mockImplementation(() => ({
			martix: vi.fn(() => [[]]),
			a: 0,
			b: 0,
			c: 0,
			d: 0,
			e: 0,
			f: 0,
			flipX: vi.fn().mockImplementation(() => global.SVGSVGElement),
			flipY: vi.fn().mockImplementation(() => global.SVGSVGElement),
			inverse: vi.fn().mockImplementation(() => global.SVGSVGElement),
			multiply: vi.fn().mockImplementation(() => global.SVGSVGElement),
			rotate: vi.fn().mockImplementation(() => ({
				translate: vi.fn().mockImplementation(() => ({
					rotate: vi.fn(),
				})),
			})),
			rotateFromVector: vi.fn().mockImplementation(() => global.SVGSVGElement),
			scale: vi.fn().mockImplementation(() => global.SVGSVGElement),
			scaleNonUniform: vi.fn().mockImplementation(() => global.SVGSVGElement),
			skewX: vi.fn().mockImplementation(() => global.SVGSVGElement),
			skewY: vi.fn().mockImplementation(() => global.SVGSVGElement),
			translate: vi.fn().mockImplementation(() => ({
				multiply: vi.fn().mockImplementation(() => ({
					multiply: vi.fn().mockImplementation(() => global.SVGSVGElement),
				})),
				rotate: vi.fn().mockImplementation(() => ({
					translate: vi.fn().mockImplementation(() => ({
						rotate: vi.fn(),
					})),
				})),
			})),
		})),
	});

	Object.defineProperty(global.SVGSVGElement.prototype, 'createSVGPoint', {
		writable: true,
		value: vi.fn().mockImplementation(() => ({
			x: 0,
			y: 0,
			matrixTransform: vi.fn().mockImplementation(() => ({
				x: 0,
				y: 0,
			})),
		})),
	});

	Object.defineProperty(global.SVGSVGElement.prototype, 'createSVGTransform', {
		writable: true,
		value: vi.fn().mockImplementation(() => ({
			angle: 0,
			matrix: {
				a: 1,
				b: 0,
				c: 0,
				d: 1,
				e: 0,
				f: 0,
				multiply: vi.fn(),
			},
			setMatrix: vi.fn(),
			setTranslate: vi.fn(),
		})),
	});
}

vi.mock('@clientio/rappid', async () => {
	const actual = vi.importActual('@clientio/rappid');
	mockSVG();
	return actual;
});

vi.mock('html2canvas', () => ({}));
vi.mock('react-dnd', () => ({
	DndProvider: ({ children }) => children,
	useDrop: vi.fn().mockImplementation(() => [vi.fn(), vi.fn(), vi.fn()]),
	useDrag: vi.fn().mockImplementation(() => [vi.fn(), vi.fn(), vi.fn()]),
}));
vi.mock('react-data-grid-canary', () => ({
	default: ({ children }) => children,
	TextEditor: ({ children }) => children,
}));
vi.mock('mapbox-gl', () => ({
	default: {
		setRTLTextPlugin: () => {
			// Do nothing.
		},
		Map: () => {
			// Do nothing.
		},
	},
}));
vi.mock('mapbox-gl-draw-freehand-mode', () => ({
	default: ({ children }) => children,
}));

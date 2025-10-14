import { Fragment, type SVGAttributes } from 'react';

const RADIUS = 85;
const START_RAD = (Math.PI / 180) * 210;
const END_RAD = (Math.PI / 180) * -30;
const SMALL_TICK_LEN = 5;
const LARGE_TICK_LEN = 10;
const LARGE_TICK_TEXT_INSET = 20;

const WIDTH = RADIUS * 2 + 5;
const HEIGHT = RADIUS * 2 + 5;

const CX = WIDTH / 2; // Center x
const CY = HEIGHT / 2; // Center y

function WidgetSpeedometer({
	min = 0,
	max,
	value: unnormalizedValue,
	smallTickEvery,
	largeTickEvery,
	...props
}: {
	min?: number;
	max: number;
	value: number;
	smallTickEvery: number;
	largeTickEvery: number;
} & SVGAttributes<SVGElement>) {
	const value = Math.max(Math.min(unnormalizedValue, max), min);

	function valToRad(val: number): number {
		return START_RAD - ((val - min) / (max - min)) * (START_RAD - END_RAD);
	}

	function valToX(val: number, r = RADIUS) {
		const rad = valToRad(val);
		return CX + Math.cos(rad) * r;
	}

	function valToY(val: number, r = RADIUS) {
		const rad = valToRad(val);
		return CY - Math.sin(rad) * r;
	}

	return (
		<svg width={WIDTH} height={HEIGHT} {...props}>
			<path
				d={`M ${valToX(min)} ${valToY(min)} A ${RADIUS} ${RADIUS} 0 ${valToRad(min) - valToRad(max) > Math.PI ? '1' : '0'} 1 ${valToX(max)} ${valToY(max)}`}
				fill="none"
				stroke="var(--ring)"
				strokeWidth={4}
				strokeLinecap="round"
			/>
			<path
				d={`M ${valToX(min)} ${valToY(min)} A ${RADIUS} ${RADIUS} 0 ${valToRad(min) - valToRad(value) > Math.PI ? '1' : '0'} 1 ${valToX(value)} ${valToY(value)}`}
				stroke="currentColor"
				fill="none"
				strokeWidth={6}
				strokeLinecap="round"
			/>
			<g strokeWidth={2} strokeLinecap="round" fill="none">
				{/* Creates an array with every value that a small tick would be */}
				{Array.from({ length: (max - min) / smallTickEvery + 1 }, (_, i) => min + i * smallTickEvery).map((val) => (
					<path
						key={val}
						d={`M ${valToX(val)} ${valToY(val)} L ${valToX(val, RADIUS - SMALL_TICK_LEN)} ${valToY(val, RADIUS - SMALL_TICK_LEN)}`}
						stroke={value >= val ? 'currentColor' : 'var(--ring)'}
					/>
				))}
			</g>
			<g strokeWidth={2} strokeLinecap="round" fill="none">
				{/* Creates an array with every value that a large tick would be */}
				{Array.from({ length: (max - min) / largeTickEvery + 1 }, (_, i) => min + i * largeTickEvery).map((val) => (
					<Fragment key={val}>
						<path
							d={`M ${valToX(val)} ${valToY(val)} L ${valToX(val, RADIUS - LARGE_TICK_LEN)} ${valToY(val, RADIUS - LARGE_TICK_LEN)}`}
							stroke={value >= val ? 'currentColor' : 'var(--ring)'}
						/>
						<text
							x={valToX(val, RADIUS - LARGE_TICK_TEXT_INSET)}
							y={valToY(val, RADIUS - LARGE_TICK_TEXT_INSET)}
							fill={value >= val ? 'currentColor' : 'var(--ring)'}
							fontSize={12}
							textAnchor="middle"
							dominantBaseline="middle"
						>
							{val}
						</text>
					</Fragment>
				))}
			</g>
		</svg>
	);
}

export default WidgetSpeedometer;

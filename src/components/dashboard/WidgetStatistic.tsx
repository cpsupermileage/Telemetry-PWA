import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';

const widgetStatisticVariants = cva('[h3]:font-bold [small]:text-muted-foreground', {
	variants: {
		size: {
			default: '[h3]:text-2xl [small]:text-sm',
			lg: '[h3]:text-3xl [&_small]:text-base',
			xl: '[h3]:text-4xl [small]:text-base',
			'2xl': '[h3]:text-5xl [small]:text-lg',
		},
	},
	defaultVariants: {
		size: 'default',
	},
});

function WidgetStatistic({
	value,
	suffix,
	unit,
	delta = 2,
	size,
	className,
	...props
}: {
	value?: string | number | null;
	suffix?: string;
	unit?: string;
	delta?: number;
} & HTMLAttributes<HTMLSpanElement> &
	VariantProps<typeof widgetStatisticVariants>) {
	return (
		<>
			<h3 className={widgetStatisticVariants({ size, className })} {...props}>
				{value !== undefined && value !== null ? (typeof value === 'number' ? value.toFixed(delta) : value) : '--'}
				{suffix}
			</h3>
			<small className={widgetStatisticVariants({ size, className })} {...props}>
				{unit}
			</small>
		</>
	);
}

export { WidgetStatistic, widgetStatisticVariants };

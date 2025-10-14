import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';

const widgetStatisticVariants = cva('[h3]:font-bold [small]:text-muted-foreground', {
	variants: {
		size: {
			default: '[h3]:text-2xl [small]:text-sm',
			lg: '[h3]:text-3xl [small]:text-base',
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
	unit,
	delta = 2,
	size,
	className,
	...props
}: { value?: string | number; unit?: string; delta?: number } & HTMLAttributes<HTMLSpanElement> &
	VariantProps<typeof widgetStatisticVariants>) {
	return (
		<>
			<h3 className={widgetStatisticVariants({ size, className })} {...props}>
				{value !== undefined ? (typeof value === 'number' ? value.toFixed(delta) : value) : '--'}
			</h3>
			<small className={widgetStatisticVariants({ size, className })} {...props}>
				{unit}
			</small>
		</>
	);
}

export { WidgetStatistic, widgetStatisticVariants };

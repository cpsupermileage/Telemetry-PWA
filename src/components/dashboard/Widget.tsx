import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';

const widgetVariants = cva(
	'bg-card text-card-foreground flex flex-col items-center justify-center rounded-lg border shadow-sm overflow-hidden',
	{
		variants: {
			size: {
				default: 'text-lg [&>small]:text-sm',
				lg: 'text-2xl [&>small]:text-base',
				xl: 'text-4xl [&>small]:text-base',
				'2xl': 'text-6xl [&>small]:text-lg',
			},
		},
		defaultVariants: {
			size: 'default',
		},
	}
);

function Widget({
	value,
	unit,
	delta = 2,
	size,
	className,
	...props
}: { value?: number; unit?: string; delta?: number } & HTMLAttributes<HTMLDivElement> &
	VariantProps<typeof widgetVariants>) {
	return (
		<div {...props} className={cn(widgetVariants({ size, className }))}>
			<h3 className="font-bold">{value?.toFixed(delta) ?? '--'}</h3>
			<small className="text-muted-foreground font-normal">{unit}</small>
		</div>
	);
}

export { Widget, widgetVariants };

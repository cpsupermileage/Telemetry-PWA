import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

function Widget({
	children,
	className,
	...props
}: { value?: number; unit?: string; delta?: number } & HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			{...props}
			className={cn(
				'flex flex-col items-center justify-center overflow-hidden rounded-lg bg-black/50 shadow-sm',
				className
			)}
		>
			{children}
		</div>
	);
}

export default Widget;

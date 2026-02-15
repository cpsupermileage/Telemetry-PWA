import z from 'zod/v4';

export const tripSchema = z
	.array(
		z.strictObject({
			id: z.int().min(-9_007_199_254_740_991).max(9_007_199_254_740_991),
			name: z.string().min(1).max(512),
			type: z.int().min(-9_007_199_254_740_991).max(9_007_199_254_740_991),
			createdAt: z.int().min(-9_007_199_254_740_991).max(9_007_199_254_740_991),
			startedAt: z.int().min(-9_007_199_254_740_991).max(9_007_199_254_740_991).optional(),
			endedAt: z.int().min(-9_007_199_254_740_991).max(9_007_199_254_740_991).optional(),
		})
	)
	.min(1)
	.max(50);

import z from 'zod/v4';

export const telemetrySchema = z
	.array(
		z.strictObject({
			id: z.int().min(-9_007_199_254_740_991).max(9_007_199_254_740_991),
			tripId: z.int().min(-9_007_199_254_740_991).max(9_007_199_254_740_991),
			time: z.int().min(-9_007_199_254_740_991).max(9_007_199_254_740_991),
			// data values
			tempMosfet: z.number().min(-140_737_488_355_328).max(140_737_488_355_327).optional(),
			tempMotor: z.number().min(-140_737_488_355_328).max(140_737_488_355_327).optional(),
			motorCurrent: z.number().min(-140_737_488_355_328).max(140_737_488_355_327).optional(),
			inputCurrent: z.number().min(-140_737_488_355_328).max(140_737_488_355_327).optional(),
			dutyCycle: z.number().min(-140_737_488_355_328).max(140_737_488_355_327).optional(),
			tacho: z.number().min(-140_737_488_355_328).max(140_737_488_355_327).optional(),
			rpm: z.number().min(-140_737_488_355_328).max(140_737_488_355_327).optional(),
			volts: z.number().min(-140_737_488_355_328).max(140_737_488_355_327).optional(),
			wattHours: z.number().min(-140_737_488_355_328).max(140_737_488_355_327).optional(),
			error: z.int().min(-9_007_199_254_740_991).max(9_007_199_254_740_991).optional(),
			// phone values
			lat: z.number().min(-140_737_488_355_328).max(140_737_488_355_327).optional(),
			long: z.number().min(-140_737_488_355_328).max(140_737_488_355_327).optional(),
			heading: z.number().min(-140_737_488_355_328).max(140_737_488_355_327).optional(),
		})
	)
	.min(1)
	.max(50);

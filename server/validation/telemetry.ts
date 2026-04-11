import z from 'zod/v4';

export const telemetrySchema = z
	.array(
		z.object({
			id: z.int().min(-9_007_199_254_740_991).max(9_007_199_254_740_991),
			tripId: z.int().min(-9_007_199_254_740_991).max(9_007_199_254_740_991),
			time: z.int().min(0).max(9_007_199_254_740_991),
			// data values
			tempMosfet: z.number().min(-140_737_488_355_328).max(140_737_488_355_327).nullable(),
			tempMotor: z.number().min(-140_737_488_355_328).max(140_737_488_355_327).nullable(),
			motorCurrent: z.number().min(-140_737_488_355_328).max(140_737_488_355_327).nullable(),
			inputCurrent: z.number().min(-140_737_488_355_328).max(140_737_488_355_327).nullable(),
			dutyCycle: z.number().min(-140_737_488_355_328).max(140_737_488_355_327).nullable(),
			tacho: z.number().min(-140_737_488_355_328).max(140_737_488_355_327).nullable(),
			volts: z.number().min(-140_737_488_355_328).max(140_737_488_355_327).nullable(),
			wattHours: z.number().min(-140_737_488_355_328).max(140_737_488_355_327).nullable(),
			error: z.int().min(-9_007_199_254_740_991).max(9_007_199_254_740_991).nullable(),
			// phone values
			lat: z.number().min(-140_737_488_355_328).max(140_737_488_355_327).nullable(),
			long: z.number().min(-140_737_488_355_328).max(140_737_488_355_327).nullable(),
			heading: z.number().min(-140_737_488_355_328).max(140_737_488_355_327).nullable(),
		})
	)
	.min(1)
	.max(10);

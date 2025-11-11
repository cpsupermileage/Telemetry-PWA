/**
 * A row of data describing the current state of the car.
 * Based off of https://github.com/SolidGeek/VescUart/blob/master/src/VescUart.cpp#L197
 */
export interface CarState {
	/**
	 * The temperature of the mosfet on the motor controller
	 */
	tempMosfet: number | null;
	/**
	 * Temperature of the motor
	 */
	tempMotor: number | null;
	/**
	 * The average amps fed to the motor since the last update
	 */
	motorCurrent: number | null;
	/**
	 * The average input amps into the motor controller since the last update
	 * @see https://github.com/vedderb/bldc/blob/master/motor/mc_interface.c#L1374
	 */
	inputCurrent: number | null;
	/**
	 * The current duty cycle of the motor
	 */
	dutyCycle: number | null;
	/**
	 * The absolute total motor steps taken by the motor controller since last reset.
	 * @see https://github.com/vedderb/bldc/blob/master/motor/mcpwm.c#L886
	 */
	tacho: number | null;
	/**
	 * The revolutions per minute of the car's **wheels**.
	 */
	rpm: number | null;
	/**
	 * The current voltage into the motor
	 */
	volts: number | null;
	/**
	 * The total watt hours that have been consumed since the motor controller was reset
	 */
	wattHours: number | null;
	/**
	 * The fault code, if any, currently reported by the motor controller
	 * @default NONE = 0
	 */
	error: MC_FAULT_CODE | null;
}

// https://github.com/SolidGeek/VescUart/blob/master/src/datatypes.h#L124
export enum MC_FAULT_CODE {
	NONE = 0,
	OVER_VOLTAGE,
	UNDER_VOLTAGE,
	DRV,
	ABS_OVER_CURRENT,
	OVER_TEMP_FET,
	OVER_TEMP_MOTOR,
	GATE_DRIVER_OVER_VOLTAGE,
	GATE_DRIVER_UNDER_VOLTAGE,
	MCU_UNDER_VOLTAGE,
	BOOTING_FROM_WATCHDOG_RESET,
	ENCODER_SPI,
	ENCODER_SINCOS_BELOW_MIN_AMPLITUDE,
	ENCODER_SINCOS_ABOVE_MAX_AMPLITUDE,
	FLASH_CORRUPTION,
	HIGH_OFFSET_CURRENT_SENSOR_1,
	HIGH_OFFSET_CURRENT_SENSOR_2,
	HIGH_OFFSET_CURRENT_SENSOR_3,
	UNBALANCED_CURRENTS,
	BRK,
	RESOLVER_LOT,
	RESOLVER_DOS,
	RESOLVER_LOS,
	FLASH_CORRUPTION_APP_CFG,
	FLASH_CORRUPTION_MC_CFG,
	ENCODER_NO_MAGNET,
	ENCODER_MAGNET_TOO_STRONG,
	PHASE_FILTER,
}

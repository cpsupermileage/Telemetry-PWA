/**
 * A row of data describing the current state of the car.
 * Based off of https://github.com/SolidGeek/VescUart/blob/master/src/VescUart.cpp#L197
 */
export interface CarState {
	/**
	 * The temperature of the mosfet on the motor controller
	 */
	tempMosfet: number;
	/**
	 * Temperature of the motor
	 */
	tempMotor: number;
	/**
	 * The average amps fed to the motor since the last update
	 */
	motorCurrent: number;
	/**
	 * The average input amps into the motor controller since the last update
	 * @see https://github.com/vedderb/bldc/blob/master/motor/mc_interface.c#L1374
	 */
	inputCurrent: number;
	/**
	 * The current duty cycle of the motor
	 */
	dutyCycle: number;
	/**
	 * The revolutions per minute of the car's motor output.
	 */
	rpm: number;
	/**
	 * The current voltage into the motor
	 */
	volts: number;
	/**
	 * The total watt hours that have been consumed since the motor controller was reset
	 */
	wattHours: number;
	/**
	 * The fault code, if any, currently reported by the motor controller
	 * @default FAULT_CODE_NONE = 0
	 */
	error: MC_FAULT_CODE;
}

// https://github.com/SolidGeek/VescUart/blob/master/src/datatypes.h#L124
export enum MC_FAULT_CODE {
	FAULT_CODE_NONE = 0,
	FAULT_CODE_OVER_VOLTAGE,
	FAULT_CODE_UNDER_VOLTAGE,
	FAULT_CODE_DRV,
	FAULT_CODE_ABS_OVER_CURRENT,
	FAULT_CODE_OVER_TEMP_FET,
	FAULT_CODE_OVER_TEMP_MOTOR,
	FAULT_CODE_GATE_DRIVER_OVER_VOLTAGE,
	FAULT_CODE_GATE_DRIVER_UNDER_VOLTAGE,
	FAULT_CODE_MCU_UNDER_VOLTAGE,
	FAULT_CODE_BOOTING_FROM_WATCHDOG_RESET,
	FAULT_CODE_ENCODER_SPI,
	FAULT_CODE_ENCODER_SINCOS_BELOW_MIN_AMPLITUDE,
	FAULT_CODE_ENCODER_SINCOS_ABOVE_MAX_AMPLITUDE,
	FAULT_CODE_FLASH_CORRUPTION,
	FAULT_CODE_HIGH_OFFSET_CURRENT_SENSOR_1,
	FAULT_CODE_HIGH_OFFSET_CURRENT_SENSOR_2,
	FAULT_CODE_HIGH_OFFSET_CURRENT_SENSOR_3,
	FAULT_CODE_UNBALANCED_CURRENTS,
	FAULT_CODE_BRK,
	FAULT_CODE_RESOLVER_LOT,
	FAULT_CODE_RESOLVER_DOS,
	FAULT_CODE_RESOLVER_LOS,
	FAULT_CODE_FLASH_CORRUPTION_APP_CFG,
	FAULT_CODE_FLASH_CORRUPTION_MC_CFG,
	FAULT_CODE_ENCODER_NO_MAGNET,
	FAULT_CODE_ENCODER_MAGNET_TOO_STRONG,
	FAULT_CODE_PHASE_FILTER,
}

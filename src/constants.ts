// The amount of time there is to complete the race, in milliseconds
// Used to calculate time remaining
export const RACE_TIME_MILLIS = 30 * 60 * 1000; // 30 minutes, temp value

// The length of the race
// Used to calculate the miles remaining
export const RACE_LENGTH_MILES = 10;

// Powered wheel diameter, used for converting RPM to speed
export const WHEEL_RADIUS_METERS = 0.2; // temp value

// The number of motor steps, should be 3 * MOTOR_POLE_NUMBER
// Used to convert tachos to distance
// See https://github.com/vedderb/bldc/blob/master/motor/mcpwm.c#L886
export const MOTOR_STEPS = 3; // temp value

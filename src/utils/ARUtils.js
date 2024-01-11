// https://gist.github.com/paulkaplan/5184275

/**
 * @param {number} x
 * @param {number} min
 * @param {number} max
 * @returns {number} clamped number
 */
function clamp(value, min, max) {
    if (value < min) {
        return min;
    } else if (value > max) {
        return max;
    } else {
        return value;
    }
}

/**
 *
 * @param {number} kelvin
 * @returns {number[]} [red, green, blue], ranged between [0, 1]
 */
function colorTemperatureToRGB(kelvin) {
    var temp = kelvin / 100;

    var red, green, blue;

    if (temp <= 66) {
        red = 255;

        green = temp;
        green = 99.4708025861 * Math.log(green) - 161.1195681661;

        if (temp <= 19) {
            blue = 0;
        } else {
            blue = temp - 10;
            blue = 138.5177312231 * Math.log(blue) - 305.0447927307;
        }
    } else {
        red = temp - 60;
        red = 329.698727446 * Math.pow(red, -0.1332047592);

        green = temp - 60;
        green = 288.1221695283 * Math.pow(green, -0.0755148492);

        blue = 255;
    }

    return [red, green, blue].map((value) => clamp(value / 255, 0, 1));
}

export { colorTemperatureToRGB };

import Console from "./Console.js";

const _console = new Console();

/**
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function greaterCommonFactor(a, b) {
    return b === 0 ? a : greaterCommonFactor(b, a % b);
}

/**
 * @param {number[]} numbers
 * @returns {number?}
 */
function findGreatestCommonFactor(numbers) {
    _console.log("finding greatestCommonFactor of numbers", numbers);
    numbers = numbers.filter((number) => number > 0);

    if (numbers.length == 0) {
        return null;
    }

    const greatestCommonFactor = numbers.reduce((number, gcf) => greaterCommonFactor(number, gcf));
    _console.log("greatestCommonFactor", greatestCommonFactor);
    if (greatestCommonFactor == 0) {
        return null;
    }
    return greatestCommonFactor;
}

export { findGreatestCommonFactor };

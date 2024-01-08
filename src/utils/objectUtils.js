/**
 * @param {object} a
 * @param {object} b
 * @returns {boolean}
 */
function areObjectsEqual(a, b) {
    if (typeof a != "object" || typeof b != "object") {
        return false;
    }

    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);

    if (aKeys.length != bKeys.length) {
        return false;
    }

    const areEqual = aKeys.every((aKey) => {
        if (aKey in b) {
            return a[aKey] == b[aKey];
        } else {
            return false;
        }
    });
    return areEqual;
}

export { areObjectsEqual };

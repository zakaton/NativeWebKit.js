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

/**
 *
 * @param {object} object
 * @param {boolean} recursive
 * @returns {object} sorted object
 */
function sortObjectKeysAlphabetically(object, recursive = true) {
    const sortedKeys = Object.keys(object).sort();
    const sortedObject = {};
    sortedKeys.forEach((key) => {
        let value = object[key];
        if (typeof value == "object" && recursive) {
            value = sortObjectKeysAlphabetically(value, recursive);
        }
        sortedObject[key] = value;
    });
    return sortedObject;
}

/**
 *
 * @param {object} object
 * @param {boolean} recursive
 * @returns {string}
 */
function stringifyObjectAlphabetically(object, recursive = true) {
    return JSON.stringify(sortObjectKeysAlphabetically(object, recursive), null, 2);
}

export { areObjectsEqual, sortObjectKeysAlphabetically, stringifyObjectAlphabetically };

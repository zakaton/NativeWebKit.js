import Console from "./Console.js";

const _console = new Console();

/**
 * Returns true if the webpage is running inside Safari
 * @returns {Boolean}
 */
function isInSafari() {
    const { userAgent } = navigator;
    return /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);
}

/**
 * Returns true if the webpage is running inside the NativeWebKit app
 * @returns {Boolean}
 */
function isInApp() {
    const { userAgent } = navigator;
    return /NativeWebKit/i.test(userAgent);
}

/**
 * Returns true if the webpage is running in Safari and the NativeWebKit Safari Extension is installed
 * @returns {Boolean}
 */
function isSafariExtensionInstalled() {
    return isInSafari() && Boolean(window.isNativeWebKitSafariExtensionInstalled);
}

/**
 * Returns true if running in the NativeWebKit app or if running in Safari with the NativeWebKit Safari Extension
 * @returns {Boolean}
 */
function isNativeWebKitEnabled() {
    if (isInApp() || isSafariExtensionInstalled()) {
        return true;
    } else {
        return false;
    }
}

function assertNativeWebKitIsEnabled() {
    console.assert(isNativeWebKitEnabled(), "NativeWebKit is not available in this context");
}

export { isInApp, isInSafari, isSafariExtensionInstalled, isNativeWebKitEnabled };

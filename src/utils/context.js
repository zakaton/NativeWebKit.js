const { userAgent } = navigator;

const isInSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);

const isInApp = /NativeWebKit/i.test(userAgent);

const isSafariExtensionInstalled = Boolean(window.isNativeWebKitSafariExtensionInstalled);

const isNativeWebKitEnabled = isInApp || isSafariExtensionInstalled;

const is_iOS = /iPad|iPhone|iPod/.test(userAgent);

const isMac = /Macintosh/.test(userAgent);

/** @type {"__NATIVEWEBKIT__DEV__" | "__NATIVEWEBKIT__PROD__"} */
const __NATIVEWEBKIT__ENVIRONMENT__ = "__NATIVEWEBKIT__DEV__";

const isInProduction = __NATIVEWEBKIT__ENVIRONMENT__ == "__NATIVEWEBKIT__PROD__";
const isInDev = __NATIVEWEBKIT__ENVIRONMENT__ == "__NATIVEWEBKIT__DEV__";

export {
    isInApp,
    isInSafari,
    isSafariExtensionInstalled,
    isNativeWebKitEnabled,
    is_iOS,
    isMac,
    isInProduction,
    isInDev,
};

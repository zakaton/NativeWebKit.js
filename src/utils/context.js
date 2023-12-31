const { userAgent } = navigator;

const isInSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);

const isInApp = /NativeWebKit/i.test(userAgent);

const isSafariExtensionInstalled = isInSafari && Boolean(window.isNativeWebKitSafariExtensionInstalled);

const isNativeWebKitEnabled = isInApp || isSafariExtensionInstalled;

const is_iOS = /iPad|iPhone|iPod/.test(userAgent);

const isMac = /Macintosh/.test(userAgent);

export { isInApp, isInSafari, isSafariExtensionInstalled, isNativeWebKitEnabled, is_iOS, isMac };

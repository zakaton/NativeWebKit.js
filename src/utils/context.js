import Console from "./Console.js";

const _console = new Console();

const { userAgent } = navigator;

const isInSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);

const isInApp = /NativeWebKit/i.test(userAgent);

var isSafariExtensionInstalled = Boolean(window.isNativeWebKitSafariExtensionInstalled);

const checkIfSafariExtensionIsInstalled = async () => {
    if (isSafariExtensionInstalled) {
        return true;
    } else {
        _console.log("checking if Safari Extension is installed...");
        return new Promise((resolve) => {
            const eventListener = () => {
                _console.log("Safari Extension is installed");
                isSafariExtensionInstalled = true;
                resolve(true);
            };
            window.addEventListener("nativewebkit-extension-is-installed", eventListener, { once: true });
            window.dispatchEvent(new Event("is-nativewebkit-extension-installed"));
            window.setTimeout(() => {
                if (!isSafariExtensionInstalled) {
                    _console.log("Safari Extension is not installed");
                    window.removeEventListener("nativewebkit-extension-is-installed", eventListener);
                    resolve(false);
                }
            }, 1);
        });
    }
};

var isNativeWebKitEnabled = isInApp || isSafariExtensionInstalled;
const checkIfNativeWebKitEnabled = async () => {
    if (isNativeWebKitEnabled) {
        return true;
    } else {
        isNativeWebKitEnabled = await checkIfSafariExtensionIsInstalled();
        return isNativeWebKitEnabled;
    }
};

const is_iOS = /iPad|iPhone|iPod/.test(userAgent);

const isMac = /Macintosh/.test(userAgent);

export { isInApp, isInSafari, checkIfSafariExtensionIsInstalled, checkIfNativeWebKitEnabled, is_iOS, isMac };

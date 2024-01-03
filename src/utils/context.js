import Console from "./Console.js";

const _console = new Console();

const { userAgent } = navigator;

const isInSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);

const isInApp = /NativeWebKit/i.test(userAgent);

var isSafariExtensionInstalled = false;
/**
 * @returns {Promise<boolean>}
 */
const checkIfSafariExtensionIsInstalled = async () => {
    if (isInSafari) {
        if (window.isNativeWebKitSafariExtensionInstalled) {
            _console.log("window.isNativeWebKitSafariExtensionInstalled is true");
            return true;
        }
        return new Promise((resolve) => {
            const eventListener = () => {
                _console.log(`received "nativewebkit-is-enabled" response from content.js`);
                isSafariExtensionInstalled = true;
                resolve(true);
            };

            window.addEventListener("nativewebkit-is-enabled", eventListener, { once: true });
            setTimeout(() => {
                if (window.isNativeWebKitSafariExtensionInstalled) {
                    _console.log("window.isNativeWebKitSafariExtensionInstalled is true after timeout");
                    resolve(true);
                }
                _console.log(`"nativewebkit-is-enabled" timeout ran out`);
                if (!isSafariExtensionInstalled) {
                    resolve(false);
                    window.removeEventListener("nativewebkit-is-enabled", eventListener);
                }
            }, 0);

            _console.log(`sending "nativewebkit-is-enabled" request to content.js`);
            window.dispatchEvent(new Event("is-nativewebkit-enabled"));
        });
    } else {
        return false;
    }
};

const checkIfNativeWebKitIsEnabled = async () => {
    if (isInApp) {
        return true;
    } else {
        if (!isSafariExtensionInstalled) {
            _console.log("checking if safari extension is installed...");
            isSafariExtensionInstalled = await checkIfSafariExtensionIsInstalled();
            _console.log(`isSafariExtensionInstalled? ${isSafariExtensionInstalled}`);
        }
        return isSafariExtensionInstalled;
    }
};

const is_iOS = /iPad|iPhone|iPod/.test(userAgent);

const isMac = /Macintosh/.test(userAgent);

export { isInApp, isInSafari, checkIfSafariExtensionIsInstalled, checkIfNativeWebKitIsEnabled, is_iOS, isMac };

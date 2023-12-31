import Console from "./Console.js";
import { isNativeWebKitEnabled, isInApp, isSafariExtensionInstalled } from "./context.js";

const _console = new Console();

/** @type {Set.<number>} */
const appMessageIds = new Set();
/** @returns {number} */
function generateAppMessageId() {
    var id = 0;
    while (appMessageIds.has(id)) {
        id++;
    }
    appMessageIds.add(id);
    return id;
}

/** @type {Map.<function, function>} */
const appListeners = new Map();
/**
 * @param {function} callback
 */
function addAppListener(callback) {
    const windowListener = (event) => {
        callback(event.detail);
    };
    appListeners.set(callback, windowListener);
    window.addEventListener("nativewebkit-receive", windowListener);
}

/**
 * @param {function} callback
 */
function removeAppListener(callback) {
    if (!appListeners.has(callback)) {
        _console.warn("no appListener for callback", callback);
        return;
    }
    const windowListener = appListeners.get(callback);
    window.removeEventListener("nativewebkit-receive", windowListener);
    appListeners.delete(callback);
}

/**
 * @typedef NKMessage
 * @type {object}
 * @property {string} type
 */

/**
 * @param {NKMessage|NKMessage[]} message
 * @returns {Promise<object>}
 */
async function sendMessageToApp(message) {
    if (isNativeWebKitEnabled) {
        if (isInApp) {
            return webkit.messageHandlers.nativewebkit_reply.postMessage(message);
        } else {
            return new Promise((resolve) => {
                const id = generateAppMessageId();
                window.dispatchEvent(new CustomEvent("nativewebkit-send", { detail: { message, id } }));
                window.addEventListener(
                    `nativewebkit-receive-${id}`,
                    (event) => {
                        const response = event.detail;
                        resolve(response);
                        appMessageIds.delete(id);
                    },
                    { once: true }
                );
            });
        }
    } else {
        _console.warn(
            "NativeWebKit.js is not enabled - run in the NativeWebKit app or enable the NativeWebKit Safari Web Extension"
        );
    }
}

export { sendMessageToApp, addAppListener, removeAppListener };

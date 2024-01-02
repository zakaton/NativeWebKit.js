import Console from "./Console.js";
import { isInApp, checkIfNativeWebKitIsEnabled } from "./context.js";

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

/** @type {Object.<string, [(NKMessage) => void]>} */
const appListeners = {};
/**
 * @param {function} callback
 * @param {string} prefix
 */
function addAppListener(callback, prefix) {
    _console.log(`adding callback with prefix "${prefix}"`, callback);
    if (!appListeners[prefix]) {
        appListeners[prefix] = [];
    }
    appListeners[prefix].push(callback);
}

if (!window.__NATIVEWEBKIT_LISTENER_FLAG__) {
    window.__NATIVEWEBKIT_LISTENER_FLAG__ = true;
    _console.log(`adding "nativewebkit-receive" window listener`);

    window.addEventListener("nativewebkit-receive", (event) => {
        /** @type {NKMessage|NKMessage[]} */
        let messages = event.detail;
        onAppMessages(messages);
    });
}

/**
 * @param {NKMessage|NKMessage[]} messages
 */
function onAppMessages(messages) {
    if (!Array.isArray(messages)) {
        messages = [messages];
    }
    _console.log("nativewebkit-receive messages", messages);
    messages.forEach((message) => {
        const [prefix, type] = message.type.split("-");
        _console.log(`received "${prefix}" message of type "${type}"`, message);
        message.type = type;
        if (!appListeners[prefix] || appListeners[prefix].length == 0) {
            _console.warn("no callbacks listening for prefix", prefix);
        } else {
            appListeners[prefix].forEach((callback) => {
                _console.log("triggering callback", callback, "for message", message);
                callback(message);
            });
        }
    });
}

/**
 * @param {function} callback
 * @param {string} prefix
 */
function removeAppListener(callback, prefix) {
    if (!appListeners[prefix]?.includes(callback)) {
        _console.warn("no appListener for callback", callback, "for prefix", prefix);
        return;
    }
    const index = appListeners[prefix].indexOf(callback);
    appListeners[prefix].splice(index, 1);
    _console.log("removed app listener");
}

/**
 * @typedef NKMessage
 * @type {object}
 * @property {string} type
 */

/**
 * @param {NKMessage|NKMessage[]} message
 * @returns {Promise<boolean>} did receive message?
 */
async function sendMessageToApp(message) {
    Boolean(window.isNativeWebKitSafariExtensionInstalled);
    const isNativeWebKitEnabled = await checkIfNativeWebKitIsEnabled();
    if (isNativeWebKitEnabled) {
        _console.log("sending message to app...", message);
        if (isInApp) {
            /** @type {NKMessage|NKMessage[]} */
            const messages = await webkit.messageHandlers.nativewebkit_reply.postMessage(message);
            _console.log("app response", messages);
            if (messages) {
                onAppMessages(messages);
            }
            return true;
        } else {
            return new Promise((resolve) => {
                const id = generateAppMessageId();
                window.dispatchEvent(new CustomEvent("nativewebkit-send", { detail: { message, id } }));
                window.addEventListener(
                    `nativewebkit-receive-${id}`,
                    (event) => {
                        /** @type {boolean} */
                        const didReceiveMessage = event.detail;
                        _console.log(`did receive message for nativewebkit-receive-${id}?`, didReceiveMessage);
                        if (!didReceiveMessage) {
                            _console.error(`didn't receive message for nativewebkit-receive-${id}`);
                        }
                        resolve(didReceiveMessage);
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

import Console from "./Console.js";
import { isInApp, checkIfNativeWebKitEnabled } from "./platformUtils.js";

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

if (!window.__NATIVEWEBKIT_MESSAGING_FLAG__) {
    window.__NATIVEWEBKIT_MESSAGING_FLAG__ = true;
    _console.log(`adding "nativewebkit-receive" window listener`);

    window.addEventListener("nativewebkit-receive", (event) => {
        /** @type {NKMessage|NKMessage[]} */
        let messages = event.detail;
        onAppMessages(messages);
    });

    window.addEventListener("load", () => {
        _console.log("triggering window.load events...");
        const messages = appListeners["window.load"]
            ?.map((callback) => callback())
            .flat()
            .filter(Boolean);
        if (messages.length > 0) {
            sendMessageToApp(messages);
        }
    });
    window.addEventListener("unload", () => {
        _console.log("triggering window.unload events...");
        const messages = appListeners["window.unload"]
            ?.map((callback) => callback())
            .flat()
            .filter(Boolean);
        if (messages.length > 0) {
            sendMessageToApp(messages);
        }
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

/** @typedef {Promise<boolean>} NKMessagePromise */

/** @type {NKMessage[]} */
var pendingMessagesToSend = [];
/** @type {NKMessagePromise?} */
var pendingMessagesPromise;
/** @type {PromiseLike<boolean>?} */
var pendingMessagesPromiseResolve;

/**
 * @param {NKMessage|NKMessage[]} message
 * @param {boolean} sendImmediately
 * @returns {NKMessagePromise} did app receive message?
 */
async function sendMessageToApp(message, sendImmediately = true) {
    const isNativeWebKitEnabled = await checkIfNativeWebKitEnabled();
    if (isNativeWebKitEnabled) {
        _console.log("requesting to send message", message, "send immediately?", sendImmediately);
        if (!message && pendingMessagesToSend.length == 0) {
            _console.warn("no messages received, and no pending messages");
            return;
        }

        if (message) {
            if (pendingMessagesToSend.length == 0) {
                pendingMessagesPromise = new Promise((resolve) => {
                    pendingMessagesPromiseResolve = resolve;
                });
            }

            pendingMessagesToSend.push(message);
            pendingMessagesToSend = pendingMessagesToSend.flat();
        }

        if (pendingMessagesToSend.length == 0) {
            _console.log("no messages to send");
            return;
        }

        if (!sendImmediately) {
            return pendingMessagesPromise;
        }

        _console.log("sending messages to app...", pendingMessagesToSend);
        if (isInApp) {
            /** @type {NKMessage|NKMessage[]} */
            const messages = await webkit.messageHandlers.nativewebkit_reply.postMessage(pendingMessagesToSend);
            _console.log("app response", messages);
            if (messages) {
                onAppMessages(messages);
            }
            pendingMessagesPromiseResolve(true);
        } else {
            const id = generateAppMessageId();
            window.dispatchEvent(
                new CustomEvent("nativewebkit-send", { detail: { message: pendingMessagesToSend, id } })
            );
            window.addEventListener(
                `nativewebkit-receive-${id}`,
                (event) => {
                    /** @type {boolean} */
                    const didReceiveMessage = event.detail;
                    _console.log(`did receive message for nativewebkit-receive-${id}?`, didReceiveMessage);
                    if (!didReceiveMessage) {
                        _console.error(`didn't receive message for nativewebkit-receive-${id}`);
                    }
                    pendingMessagesPromiseResolve(didReceiveMessage);
                    appMessageIds.delete(id);
                },
                { once: true }
            );
        }
        pendingMessagesToSend.length = 0;
        return pendingMessagesPromise;
    } else {
        _console.warn(
            "NativeWebKit.js is not enabled - run in the NativeWebKit app or enable the NativeWebKit Safari Web Extension"
        );
    }
}

export { sendMessageToApp, addAppListener, removeAppListener };

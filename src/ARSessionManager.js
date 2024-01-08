import EventDispatcher from "./utils/EventDispatcher.js";
import Console from "./utils/Console.js";
import { sendMessageToApp, addAppListener } from "./utils/messaging.js";
import AppMessagePoll from "./utils/AppMessagePoll.js";
import { areObjectsEqual } from "./utils/objectUtils.js";
import { isInApp, isInSafari, isMac, is_iOS } from "./utils/platformUtils.js";

const _console = new Console("ARSession");

/** @typedef {"worldTrackingSupport" | "faceTrackingSupport" | "run" | "pause" | "isRunning" | "frame"} ARSMessageType */

/** @typedef {"worldTrackingSupport" | "faceTrackingSupport" | "isRunning" | "frame" | "camera"} ARSEventType */

/** @typedef {import("./utils/messaging.js").NKMessage} NKMessage */

/** @typedef {import("./utils/EventDispatcher.js").EventDispatcherOptions} EventDispatcherOptions */

/** @typedef {import("./utils/messaging.js").NKWindowLoadCallback} NKWindowLoadCallback */

/**
 * @typedef ARSMessage
 * @type {object}
 * @property {ARSMessageType} type
 * @property {object} message
 */

/**
 * @typedef ARSAppMessage
 * @type {object}
 * @property {ARSMessageType} type
 */

/**
 * @typedef ARSWorldTrackingSupport
 * @type {object}
 * @property {boolean} isSupported
 * @property {boolean} supportsUserFaceTracking
 */

/**
 * @typedef ARSFaceTrackingSupport
 * @type {object}
 * @property {boolean} isSupported
 * @property {boolean} supportsWorldTracking
 */

/**
 * @typedef ARSEvent
 * @type {object}
 * @property {ARSEventType} type
 * @property {object} message
 */

/**
 * @typedef {(event: ARSEvent) => void} ARSEventListener
 */

/**
 * @typedef ARSFrame
 * @type {object}
 * @property {ARSCamera} camera
 */

/**
 * @typedef ARSCamera
 * @type {object}
 * @property {number[]} position
 * @property {number[]} quaternion
 * @property {number[]} position
 * @property {number[]} eulerAngles
 */

class ARSessionManager extends EventDispatcher {
    /** @type {ARSEventType[]} */
    static #EventsTypes = ["worldTrackingSupport", "faceTrackingSupport", "isRunning", "frame", "camera"];
    /** @type {ARSEventType[]} */
    get eventTypes() {
        return ARSessionManager.#EventsTypes;
    }

    static #shared = new ARSessionManager();
    static get shared() {
        return this.#shared;
    }

    get _prefix() {
        return "ars";
    }
    /**
     * @param {ARSMessage} message
     * @returns {NKMessage}
     */
    _formatMessage(message) {
        return super._formatMessage(message);
    }

    /**
     * @param {ARSEventType} type
     * @param {ARSEventListener} listener
     * @param {EventDispatcherOptions|undefined} options
     */
    addEventListener(type, listener, options) {
        return super.addEventListener(...arguments);
    }
    /**
     * @param {ARSEventType} type
     * @param {ARSEventListener} listener
     * @returns {boolean}
     */
    removeEventListener(type, listener) {
        return super.removeEventListener(...arguments);
    }
    /**
     * @param {ARSEventType} type
     * @param {ARSEventListener} listener
     * @returns {boolean}
     */
    hasEventListener(type, listener) {
        return super.hasEventListener(...arguments);
    }
    /**
     * @param {ARSEvent} event
     */
    dispatchEvent(event) {
        return super.dispatchEvent(...arguments);
    }

    /** ARSessionManager is a singleton - use ARSessionManager.shared */
    constructor() {
        super();

        if (this.shared) {
            throw new Error("ARSessionManager is a singleton - use ARSessionManager.shared");
        }

        addAppListener(this.#getWindowLoadMessages.bind(this), "window.load");
        addAppListener(this.#onAppMessage.bind(this), this._prefix);
        addAppListener(this.#getWindowUnloadMessages.bind(this), "window.unload");
    }

    get isSupported() {
        return is_iOS && isInApp;
    }
    #warnNotSupported() {
        if (isMac) {
            _console.warn("AR Session is not supported on Mac");
        } else {
            _console.warn("AR Session not supported in iOS Safari");
        }
    }

    /** @returns {NKMessage|NKMessage[]|undefined} */
    #getWindowLoadMessages() {
        if (!this.isSupported) {
            return;
        }

        const messages = [];
        if (this.checkFaceTrackingSupportOnLoad) {
            messages.push(this.#checkFaceTrackingSupportMessage);
        }
        if (this.checkWorldTrackingSupportOnLoad) {
            messages.push(this.#checkWorldTrackingSupportMessage);
        }
        if (this.checkIsRunningOnLoad) {
            messages.push(this.#checkIsRunningMessage);
        }
        return messages;
    }
    /** @returns {NKMessage|NKMessage[]|undefined} */
    #getWindowUnloadMessages() {
        if (!this.isSupported) {
            return;
        }

        const messages = [];
        if (this.pauseOnUnload && this.isRunning) {
            messages.push(this.#pauseMessage);
        }
        return messages;
    }

    /** @type {ARSWorldTrackingSupport} */
    #worldTrackingSupport = {
        isSupported: false,
        supportsUserFaceTracking: false,
    };
    get worldTrackingSupport() {
        return this.#worldTrackingSupport;
    }
    /** @param {ARSWorldTrackingSupport} newValue */
    #onWorldTrackingSupportUpdated(newValue) {
        if (!areObjectsEqual(this.#worldTrackingSupport, newValue)) {
            this.#worldTrackingSupport = newValue;
            _console.log("updated worldTrackingSupport", newValue);
            this.dispatchEvent({
                type: "worldTrackingSupport",
                message: { worldTrackingSupport: this.worldTrackingSupport },
            });
        }
    }

    /** @type {boolean} */
    #checkWorldTrackingSupportOnLoad = false;
    get checkWorldTrackingSupportOnLoad() {
        return this.#checkWorldTrackingSupportOnLoad;
    }
    /** @throws {Error} if newValue is not a boolean */
    set checkWorldTrackingSupportOnLoad(newValue) {
        if (typeof newValue == "boolean") {
            this.#checkWorldTrackingSupportOnLoad = newValue;
        } else {
            throw Error(`invalid newValue for checkWorldTrackingSupportOnLoad`, newValue);
        }
    }

    async checkWorldTrackingSupport() {
        if (!this.isSupported) {
            this.#warnNotSupported();
            return;
        }

        _console.log("checking world tracking support...");
        return sendMessageToApp(this.#checkWorldTrackingSupportMessage);
    }
    get #checkWorldTrackingSupportMessage() {
        return this._formatMessage({ type: "worldTrackingSupport" });
    }

    /** @type {ARSFaceTrackingSupport} */
    #faceTrackingSupport = {
        isSupported: false,
        supportsWorldTracking: false,
    };
    get faceTrackingSupport() {
        return this.#faceTrackingSupport;
    }
    /** @param {ARSFaceTrackingSupport} newValue */
    #onFaceTrackingSupportUpdated(newValue) {
        if (!areObjectsEqual(this.#faceTrackingSupport, newValue)) {
            this.#faceTrackingSupport = newValue;
            _console.log("updated faceTrackingSupport", newValue);
            this.dispatchEvent({
                type: "faceTrackingSupport",
                message: { faceTrackingSupport: this.faceTrackingSupport },
            });
        }
    }

    /** @type {boolean} */
    #checkFaceTrackingSupportOnLoad = false;
    get checkFaceTrackingSupportOnLoad() {
        return this.#checkFaceTrackingSupportOnLoad;
    }
    /** @throws {Error} if newValue is not a boolean */
    set checkFaceTrackingSupportOnLoad(newValue) {
        if (typeof newValue == "boolean") {
            this.#checkFaceTrackingSupportOnLoad = newValue;
        } else {
            throw Error(`invalid newValue for checkFaceTrackingSupportOnLoad`, newValue);
        }
    }

    async checkFaceTrackingSupport() {
        if (!this.isSupported) {
            this.#warnNotSupported();
            return;
        }

        _console.log("checking face tracking support...");
        return sendMessageToApp(this.#checkFaceTrackingSupportMessage);
    }
    get #checkFaceTrackingSupportMessage() {
        return this._formatMessage({ type: "faceTrackingSupport" });
    }

    /** @type {boolean} */
    #isRunning = false;
    get isRunning() {
        return this.#isRunning;
    }
    /** @param {boolean} newValue */
    #onIsRunningUpdated(newValue) {
        if (this.#isRunning != newValue) {
            this.#isRunning = newValue;
            _console.log(`updated isRunning to ${newValue}`);
            this.dispatchEvent({
                type: "isRunning",
                message: { isRunning: this.isRunning },
            });
        }
    }
    async checkIsRunning() {
        if (!this.isSupported) {
            this.#warnNotSupported();
            return;
        }

        _console.log("checking isRunning...");
        return sendMessageToApp(this.#checkIsRunningMessage);
    }
    get #checkIsRunningMessage() {
        return this._formatMessage({ type: "isRunning" });
    }

    /** @type {boolean} */
    #checkIsRunningOnLoad = false;
    get checkIsRunningOnLoad() {
        return this.#checkIsRunningOnLoad;
    }
    /** @throws {Error} if newValue is not a boolean */
    set checkIsRunningOnLoad(newValue) {
        if (typeof newValue == "boolean") {
            this.#checkIsRunningOnLoad = newValue;
        } else {
            throw Error(`invalid newValue for checkIsRunningOnLoad`, newValue);
        }
    }

    /** @type {boolean} */
    #pauseOnUnload = true;
    get pauseOnUnload() {
        return this.#pauseOnUnload;
    }
    /** @throws {Error} if newValue is not a boolean */
    set pauseOnUnload(newValue) {
        if (typeof newValue == "boolean") {
            this.#pauseOnUnload = newValue;
        } else {
            throw Error(`invalid newValue for pauseOnUnload`, newValue);
        }
    }

    async run() {
        _console.log("run...");
        return sendMessageToApp(this.#runMessage);
    }
    get #runMessage() {
        return this._formatMessage({ type: "run" });
    }

    async pause() {
        _console.log("pause...");
        return sendMessageToApp(this.#pauseMessage);
    }
    get #pauseMessage() {
        return this._formatMessage({ type: "pause" });
    }

    /** @type {ARSFrame|null} */
    #frame = null;
    get frame() {
        return this.#frame;
    }
    /** @type {ARSCamera|null} */
    #camera;
    get camera() {
        return this.#camera;
    }

    /** @param {ARSFrame} frame */
    #onFrame(frame) {
        this.#frame = frame;
        _console.log("received frame", this.frame);
        this.dispatchEvent({ type: "frame", message: { frame: this.frame } });
        this.#onCamera(frame.camera);
    }

    /** @param {ARSCamera} camera */
    #onCamera(camera) {
        this.#camera = camera;
        _console.log("received camera", this.camera);
        this.dispatchEvent({ type: "camera", message: { camera: this.camera } });
    }

    /**
     * @param {ARSAppMessage} message
     */
    #onAppMessage(message) {
        _console.log(`received background message of type ${message.type}`, message);
        const { type } = message;
        switch (type) {
            case "faceTrackingSupport":
                _console.log("received faceTrackingSupport message", message);
                this.#onFaceTrackingSupportUpdated(message.faceTrackingSupport);
                break;
            case "worldTrackingSupport":
                _console.log("received worldTrackingSupport message", message);
                this.#onWorldTrackingSupportUpdated(message.worldTrackingSupport);
                break;
            case "isRunning":
                _console.log("received isRunning message", message);
                this.#onIsRunningUpdated(message.isRunning);
                break;
            case "frame":
                _console.log("received frame message", message);
                this.#onFrame(message.frame);
                break;
            default:
                _console.error(`uncaught message type ${type}`);
                break;
        }
    }
}

export default ARSessionManager.shared;

import EventDispatcher from "./utils/EventDispatcher.js";
import Console from "./utils/Console.js";
import { sendMessageToApp, addAppListener } from "./utils/messaging.js";
import { areObjectsEqual } from "./utils/objectUtils.js";
import { isInApp, isMac, is_iOS } from "./utils/platformUtils.js";

const _console = new Console("ARSession");

/** @typedef {"worldTrackingSupport" | "faceTrackingSupport" | "run" | "pause" | "status" | "frame" | "debugOptions" | "cameraMode" | "configuration" | "showCamera"} ARSMessageType */

/** @typedef {"worldTrackingSupport" | "faceTrackingSupport" | "isRunning" | "frame" | "camera" | "faceAnchors" | "faceAnchor" | "debugOptions" | "cameraMode" | "configuration" | "showCamera" | "lightEstimate"} ARSEventType */

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

/** @typedef {"worldTracking"|"faceTracking"} ARSConfigurationType */
/**
 * @typedef ARSConfiguration
 * @type {object}
 * @property {ARSConfigurationType} type
 */

/** @typedef {"userFaceTrackingEnabled"} ARSWorldTrackingConfigurationKey */
/**
 * @typedef _ARSWorldTrackingConfiguration
 * @type {object}
 * @property {bool} userFaceTrackingEnabled
 */
/** @typedef {ARSConfiguration & _ARSWorldTrackingConfiguration} ARSWorldTrackingConfiguration */

/** @typedef {"isWorldTrackingEnabled" | "maximumNumberOfTrackedFaces"} ARSFaceTrackingConfigurationKey */
/**
 * @typedef _ARSFaceTrackingConfiguration
 * @type {object}
 * @property {bool} isWorldTrackingEnabled
 * @property {bool} maximumNumberOfTrackedFaces
 */
/** @typedef {ARSConfiguration & _ARSFaceTrackingConfiguration} ARSFaceTrackingConfiguration */

/**
 * @typedef ARSFrame
 * @type {object}
 * @property {number} timestamp
 * @property {ARSCamera} camera
 * @property {ARSFaceAnchor[]?} faceAnchors
 * @property {ARSLightEstimate?} lightEstimate
 */

/**
 * @typedef ARSLightEstimate
 * @type {object}
 * @property {number} ambientIntensity (lumens)
 * @property {number} ambientColorTemperature (kelvin)
 * @property {number?} primaryLightIntensity (lumens)
 * @property {number[]?} primaryLightDirection
 */

/**
 * @typedef ARSCamera
 * @type {object}
 * @property {number} focalLength
 * @property {number} exposureOffset
 * @property {number[]} position not available when cameraMode is "nonAR"
 * @property {number[]} quaternion not available when cameraMode is "nonAR" - use eulerAngles instead
 * @property {number[]} position not available when cameraMode is "nonAR"
 * @property {number[]} eulerAngles
 */

/**
 * @typedef ARSFaceAnchor
 * @type {object}
 * @property {string} identifier
 * @property {number[]} lookAtPoint
 * @property {number[]} position
 * @property {number[]} quaternion innacurate if using worldTracking - use transform instead
 * @property {number[][]?} transform (column-major order) available when using worldTracking due to quaternion inaccuracy
 * @property {ARSFaceAnchorEye} leftEye
 * @property {ARSFaceAnchorEye} rightEye
 * @property {ARSFaceAnchorBlendShapes} blendShapes
 */

/**
 * @typedef ARSFaceAnchorEye
 * @type {object}
 * @property {number[]} quaternion
 * @property {number[]} position
 */

/** @typedef {"none" | "showAnchorGeometry" | "showAnchorOrigins" | "showFeaturePoints" | "showPhysics" | "showSceneUnderstanding" | "showStatistics" | "showWorldOrigin"} ARSDebugOption */

/**
 * @typedef ARSDebugOptions
 * @type {object}
 * @property {boolean} none
 * @property {boolean} showAnchorGeometry
 * @property {boolean} showAnchorOrigins
 * @property {boolean} showFeaturePoints
 * @property {boolean} showPhysics
 * @property {boolean} showSceneUnderstanding
 * @property {boolean} showStatistics
 * @property {boolean} showWorldOrigin
 */

/** @typedef {"browDownLeft" | "browDownRight" | "browInnerUp" | "browOuterUpLeft" | "browOuterUpRight" | "cheekPuff" | "cheekSquintLeft" | "cheekSquintRight" | "eyeBlinkLeft" | "eyeBlinkRight" | "eyeLookDownLeft" | "eyeLookDownRight" | "eyeLookInLeft" | "eyeLookInRight" | "eyeLookOutLeft" | "eyeLookOutRight" | "eyeLookUpLeft" | "eyeLookUpRight" | "eyeSquintLeft" | "eyeSquintRight" | "eyeWideLeft" | "eyeWideRight" | "jawForward" | "jawLeft" | "jawOpen" | "jawRight" | "mouthClose" | "mouthDimpleLeft" | "mouthDimpleRight" | "mouthFrownLeft" | "mouthFrownRight" | "mouthFunnel" | "mouthLeft" | "mouthLowerDownLeft" | "mouthLowerDownRight" | "mouthPressLeft" | "mouthPressRight" | "mouthPucker" | "mouthRight" | "mouthRollLower" | "mouthRollUpper" | "mouthShrugLower" | "mouthShrugUpper" | "mouthSmileLeft" | "mouthSmileRight" | "mouthStretchLeft" | "mouthStretchRight" | "mouthUpperUpLeft" | "mouthUpperUpRight" | "noseSneerLeft" | "noseSneerRight" | "tongueOut"} ARSFaceAnchorBlendShapeLocation */

/**
 * @typedef ARSFaceAnchorBlendShapes
 * @type {object}
 * @property {number} browDownLeft The coefficient describing downward movement of the outer portion of the left eyebrow.
 * @property {number} browDownRight The coefficient describing downward movement of the outer portion of the right eyebrow.
 * @property {number} browInnerUp The coefficient describing upward movement of the inner portion of both eyebrows.
 * @property {number} browOuterUpLeft The coefficient describing upward movement of the outer portion of the left eyebrow.
 * @property {number} browOuterUpRight The coefficient describing upward movement of the outer portion of the right eyebrow.
 * @property {number} cheekPuff The coefficient describing outward movement of both cheeks.
 * @property {number} cheekSquintLeft The coefficient describing upward movement of the cheek around and below the left eye.
 * @property {number} cheekSquintRight The coefficient describing upward movement of the cheek around and below the right eye.
 * @property {number} eyeBlinkLeft The coefficient describing closure of the eyelids over the left eye.
 * @property {number} eyeBlinkRight The coefficient describing closure of the eyelids over the right eye.
 * @property {number} eyeLookDownLeft The coefficient describing movement of the left eyelids consistent with a downward gaze.
 * @property {number} eyeLookDownRight The coefficient describing movement of the right eyelids consistent with a downward gaze.
 * @property {number} eyeLookInLeft The coefficient describing movement of the left eyelids consistent with a rightward gaze.
 * @property {number} eyeLookInRight The coefficient describing movement of the right eyelids consistent with a leftward gaze.
 * @property {number} eyeLookOutLeft The coefficient describing movement of the left eyelids consistent with a leftward gaze.
 * @property {number} eyeLookOutRight The coefficient describing movement of the right eyelids consistent with a rightward gaze.
 * @property {number} eyeLookUpLeft The coefficient describing movement of the left eyelids consistent with an upward gaze.
 * @property {number} eyeLookUpRight The coefficient describing movement of the right eyelids consistent with an upward gaze.
 * @property {number} eyeSquintLeft The coefficient describing contraction of the face around the left eye.
 * @property {number} eyeSquintRight The coefficient describing contraction of the face around the right eye.
 * @property {number} eyeWideLeft The coefficient describing a widening of the eyelids around the left eye.
 * @property {number} eyeWideRight The coefficient describing a widening of the eyelids around the right eye.
 * @property {number} jawForward The coefficient describing forward movement of the lower jaw.
 * @property {number} jawLeft The coefficient describing leftward movement of the lower jaw.
 * @property {number} jawOpen The coefficient describing an opening of the lower jaw.
 * @property {number} jawRight The coefficient describing rightward movement of the lower jaw.
 * @property {number} mouthClose The coefficient describing closure of the lips independent of jaw position.
 * @property {number} mouthDimpleLeft The coefficient describing backward movement of the left corner of the mouth.
 * @property {number} mouthDimpleRight The coefficient describing backward movement of the right corner of the mouth.
 * @property {number} mouthFrownLeft The coefficient describing downward movement of the left corner of the mouth.
 * @property {number} mouthFrownRight The coefficient describing downward movement of the right corner of the mouth.
 * @property {number} mouthFunnel The coefficient describing contraction of both lips into an open shape.
 * @property {number} mouthLeft The coefficient describing leftward movement of both lips together.
 * @property {number} mouthLowerDownLeft The coefficient describing downward movement of the lower lip on the left side.
 * @property {number} mouthLowerDownRight The coefficient describing downward movement of the lower lip on the right side.
 * @property {number} mouthPressLeft The coefficient describing upward compression of the lower lip on the left side.
 * @property {number} mouthPressRight The coefficient describing upward compression of the lower lip on the right side.
 * @property {number} mouthPucker The coefficient describing contraction and compression of both closed lips.
 * @property {number} mouthRight The coefficient describing rightward movement of both lips together.
 * @property {number} mouthRollLower The coefficient describing movement of the lower lip toward the inside of the mouth.
 * @property {number} mouthRollUpper The coefficient describing movement of the upper lip toward the inside of the mouth.
 * @property {number} mouthShrugLower The coefficient describing outward movement of the lower lip.
 * @property {number} mouthShrugUpper The coefficient describing outward movement of the upper lip.
 * @property {number} mouthSmileLeft The coefficient describing upward movement of the left corner of the mouth.
 * @property {number} mouthSmileRight The coefficient describing upward movement of the right corner of the mouth.
 * @property {number} mouthStretchLeft The coefficient describing leftward movement of the left corner of the mouth.
 * @property {number} mouthStretchRight The coefficient describing rightward movement of the left corner of the mouth.
 * @property {number} mouthUpperUpLeft The coefficient describing upward movement of the upper lip on the left side.
 * @property {number} mouthUpperUpRight The coefficient describing upward movement of the upper lip on the right side.
 * @property {number} noseSneerLeft The coefficient describing a raising of the left side of the nose around the nostril.
 * @property {number} noseSneerRight The coefficient describing a raising of the right side of the nose around the nostril.
 * @property {number} tongueOut The coefficient describing extension of the tongue.
 */

/** @typedef {"ar" | "nonAR"} ARSCameraMode */

class ARSessionManager extends EventDispatcher {
    /** @type {ARSEventType[]} */
    static #EventsTypes = [
        "worldTrackingSupport",
        "faceTrackingSupport",
        "isRunning",
        "frame",
        "camera",
        "faceAnchors",
        "faceAnchor",
        "debugOptions",
        "cameraMode",
        "configuration",
        "showCamera",
        "lightEstimate",
    ];
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
     * @param {EventDispatcherOptions?} options
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

        console.assert(!this.shared, "ARSessionManager is a singleton - use ARSessionManager.shared");

        addAppListener(this.#getWindowLoadMessages.bind(this), "window.load");
        addAppListener(this.#onAppMessage.bind(this), this._prefix);
        addAppListener(this.#getWindowUnloadMessages.bind(this), "window.unload");
    }

    get isSupported() {
        return is_iOS && isInApp;
    }
    /**
     * @throws {Error} if not supported
     */
    #assertIsSupported() {
        if (!this.isSupported) {
            if (isMac) {
                throw Error("AR Session is not supported on Mac");
            } else {
                throw Error("AR Session not supported in iOS Safari");
            }
        }
    }
    /**
     * @throws {Error} if not running
     */
    #assertIsRunning() {
        console.assert(this.isRunning, "ARSession is not running");
    }

    /** @returns {NKMessage|NKMessage[]?} */
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
        if (this.checkDebugOptionsOnLoad) {
            messages.push(this.#checkDebugOptionsMessage);
        }
        if (this.checkCameraModeOnLoad) {
            messages.push(this.#checkCameraModeMessage);
        }
        if (this.checkShowCameraOnLoad) {
            messages.push(this.#checkShowCameraMessage);
        }

        return messages;
    }
    /** @returns {NKMessage|NKMessage[]?} */
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
        console.assert(typeof newValue == "boolean", `invalid newValue for checkWorldTrackingSupportOnLoad`, newValue);
        this.#checkWorldTrackingSupportOnLoad = newValue;
    }

    async #checkWorldTrackingSupport() {
        this.#assertIsSupported();
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
        console.assert(typeof newValue == "boolean", "invalid newValue for checkFaceTrackingSupportOnLoad", newValue);
        this.#checkFaceTrackingSupportOnLoad = newValue;
    }

    async #checkFaceTrackingSupport() {
        this.#assertIsSupported();

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
            if (this.isRunning) {
                this.#checkConfiguration();
            }
        }
    }
    async #checkIsRunning() {
        this.#assertIsSupported();

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
        console.assert(typeof newValue == "boolean", "invalid newValue for checkIsRunningOnLoad", newValue);
        this.#checkIsRunningOnLoad = newValue;
    }

    /** @type {boolean} */
    #pauseOnUnload = true;
    get pauseOnUnload() {
        return this.#pauseOnUnload;
    }
    /** @throws {Error} if newValue is not a boolean */
    set pauseOnUnload(newValue) {
        console.assert(typeof newValue == "boolean", `invalid newValue for pauseOnUnload`, newValue);
        this.#pauseOnUnload = newValue;
    }

    /**
     * @param {ARSConfiguration} configuration
     * @throws {Error} if invalid
     */
    #assertConfigurationIsValid(configuration) {
        _console.log("assertConfigurationIsValid", configuration);
        console.assert(configuration, "configuration required to run ARSession");
        console.assert(configuration.type, '"type" property required in configuration"');
        console.assert(
            this.allConfigurationTypes.includes(configuration.type),
            `invalid configuration type "${configuration.type}"`
        );

        switch (configuration.type) {
            case "worldTracking":
                const invalidWorldTrackingConfigurationKey = Object.keys(configuration).find(
                    (key) => key !== "type" && !this.#worldTrackingConfigurationKeys.includes(key)
                );
                console.assert(
                    !invalidWorldTrackingConfigurationKey,
                    `invalid worldTracking configuration key "${invalidWorldTrackingConfigurationKey}"`
                );
                /** @type {ARSWorldTrackingConfiguration} */
                const worldTrackingConfiguration = configuration;
                console.assert(this.worldTrackingSupport.isSupported, "your device doesn't support world tracking");
                console.assert(
                    !worldTrackingConfiguration.userFaceTrackingEnabled ||
                        this.worldTrackingSupport.supportsUserFaceTracking,
                    "your device doesn't support user face tracking with world tracking"
                );
                break;
            case "faceTracking":
                const invalidFaceTrackingConfigurationKey = Object.keys(configuration).find(
                    (key) => key !== "type" && !this.#faceTrackingConfigurationKeys.includes(key)
                );
                console.assert(
                    !invalidFaceTrackingConfigurationKey,
                    `invalid faceTracking configuration key "${invalidFaceTrackingConfigurationKey}"`
                );
                /** @type {ARSFaceTrackingConfiguration} */
                const faceTrackingConfiguration = configuration;
                console.assert(this.faceTrackingSupport.isSupported, "your device doesn't support face tracking");
                console.assert(
                    !faceTrackingConfiguration.isWorldTrackingEnabled || this.faceTrackingSupport.supportsWorldTracking,
                    "your device doesn't support user world tracking with face tracking"
                );
                break;
            default:
                throw Error(`uncaught configuration type "${configuration.type}"`);
        }
    }

    /** @param {ARSConfiguration} configuration */
    async run(configuration) {
        this.#assertIsSupported();
        this.#assertConfigurationIsValid(configuration);

        _console.log("running with configuraton", configuration);
        return sendMessageToApp(this.#runMessage(configuration));
    }
    #runMessage(configuration) {
        return this._formatMessage({ type: "run", configuration });
    }

    async pause() {
        _console.log("pause...");
        return sendMessageToApp(this.#pauseMessage);
    }
    get #pauseMessage() {
        return this._formatMessage({ type: "pause" });
    }

    /** @type {ARSConfigurationType[]} */
    #allConfigurationTypes = ["worldTracking", "faceTracking"];
    get allConfigurationTypes() {
        return this.#allConfigurationTypes;
    }

    /** @type {ARSWorldTrackingConfigurationKey[]} */
    #worldTrackingConfigurationKeys = ["userFaceTrackingEnabled"];
    /** @type {ARSFaceTrackingConfigurationKey[]} */
    #faceTrackingConfigurationKeys = ["isWorldTrackingEnabled", "maximumNumberOfTrackedFaces"];

    /** @type {ARSConfiguration?} */
    #configuration = null;
    get configuration() {
        return this.#configuration;
    }

    async #checkConfiguration() {
        this.#assertIsSupported();
        this.#assertIsRunning();

        _console.log("checking configuration...");
        return sendMessageToApp(this.#checkConfigurationMessage);
    }
    get #checkConfigurationMessage() {
        return this._formatMessage({ type: "configuration" });
    }

    /** @param {ARSConfiguration} newConfiguration  */
    #onConfigurationUpdated(newConfiguration) {
        this.#configuration = newConfiguration;
        _console.log("updated configuration", this.configuration);
        this.dispatchEvent({
            type: "configuration",
            message: { configuration: this.configuration },
        });
    }

    /** @type {ARSFrame?} */
    #frame = null;
    get frame() {
        return this.#frame;
    }
    /** @type {ARSCamera?} */
    #camera = null;
    get camera() {
        return this.#camera;
    }
    /** @type {ARSLightEstimate?} */
    #lightEstimate = null;
    get lightEstimate() {
        return this.#lightEstimate;
    }
    /** @type {ARSFaceAnchor[]?} */
    #faceAnchors = null;
    get faceAnchors() {
        return this.#faceAnchors;
    }

    /** @param {ARSFrame} frame */
    #onFrame(frame) {
        this.#frame = frame;
        _console.log("received frame", this.frame);
        this.dispatchEvent({ type: "frame", message: { frame: this.frame } });
        this.#onCamera(frame.camera);
        if (frame.lightEstimate) {
            this.#onLightEstimate(frame.lightEstimate);
        }
        if (frame.faceAnchors) {
            this.#onFaceAnchors(frame.faceAnchors);
        }
    }

    /** @param {ARSCamera} camera */
    #onCamera(camera) {
        this.#camera = camera;
        _console.log("received camera", this.camera);
        this.dispatchEvent({ type: "camera", message: { camera: this.camera } });
    }
    /** @param {ARSLightEstimate} lightEstimate */
    #onLightEstimate(lightEstimate) {
        this.#lightEstimate = lightEstimate;
        _console.log("received lightEstimate", this.lightEstimate);
        this.dispatchEvent({ type: "lightEstimate", message: { lightEstimate: this.lightEstimate } });
    }

    /** @param {ARSFaceAnchor[]} faceAnchors */
    #onFaceAnchors(faceAnchors) {
        this.#faceAnchors = faceAnchors;
        _console.log("received faceAnchors", this.faceAnchors);
        this.dispatchEvent({ type: "faceAnchors", message: { faceAnchors: this.faceAnchors } });
        faceAnchors.forEach((faceAnchor) => {
            this.dispatchEvent({ type: "faceAnchor", message: { faceAnchor } });
        });
    }

    /** @type {ARSDebugOption[]} */
    #allDebugOptions = [
        "none",
        "showAnchorGeometry",
        "showAnchorOrigins",
        "showFeaturePoints",
        "showPhysics",
        "showSceneUnderstanding",
        "showStatistics",
        "showWorldOrigin",
    ];
    get allDebugOptions() {
        return this.#allDebugOptions;
    }

    /** @type {ARSDebugOptions?} */
    #debugOptions = null;
    get debugOptions() {
        return this.#debugOptions;
    }
    /** @param {ARSDebugOptions} newDebugOptions */
    #onDebugOptionsUpdated(newDebugOptions) {
        this.#debugOptions = newDebugOptions;
        _console.log("received debugOptions", this.debugOptions);
        this.dispatchEvent({ type: "debugOptions", message: { debugOptions: this.debugOptions } });
    }

    async #checkDebugOptions() {
        this.#assertIsSupported();

        _console.log("checking debugOptions...");
        return sendMessageToApp(this.#checkDebugOptionsMessage);
    }
    get #checkDebugOptionsMessage() {
        return this._formatMessage({ type: "debugOptions" });
    }

    /**
     * @param {ARSDebugOptions} debugOptions
     * @throws if debugOptions is not an object or has an invalid key
     */
    async setDebugOptions(debugOptions) {
        this.#assertIsSupported();
        console.assert(typeof debugOptions == "object", "debugOptions must be an object", debugOptions);
        const invalidKey = Object.keys(debugOptions).find(
            (debugOption) => !this.#allDebugOptions.includes(debugOption)
        );
        console.assert(!invalidKey, `invalid debugOptions key ${invalidKey}`);

        _console.log("setting debugOptions...", debugOptions);
        return sendMessageToApp(this.#setDebugOptionsMessage(debugOptions));
    }

    /** @param {ARSDebugOptions} debugOptions */
    #setDebugOptionsMessage(debugOptions) {
        return this._formatMessage({ type: "debugOptions", debugOptions });
    }

    /** @type {boolean} */
    #checkDebugOptionsOnLoad = false;
    get checkDebugOptionsOnLoad() {
        return this.#checkDebugOptionsOnLoad;
    }
    /** @throws {Error} if newValue is not a boolean */
    set checkDebugOptionsOnLoad(newValue) {
        console.assert(typeof newValue == "boolean", `invalid newValue for checkDebugOptionsOnLoad`, newValue);
        this.#checkDebugOptionsOnLoad = newValue;
    }

    /** @type {ARSCameraMode[]} */
    #allCameraModes = ["ar", "nonAR"];
    get allCameraModes() {
        return this.#allCameraModes;
    }

    /** @type {ARSCameraMode?} */
    #cameraMode = null;
    get cameraMode() {
        return this.#cameraMode;
    }

    async #checkCameraMode() {
        this.#assertIsSupported();

        _console.log("checking cameraMode...");
        return sendMessageToApp(this.#checkCameraModeMessage);
    }
    get #checkCameraModeMessage() {
        return this._formatMessage({ type: "cameraMode" });
    }

    /** @param {ARSCameraMode} cameraMode */
    #setCameraModeMessage(cameraMode) {
        return this._formatMessage({ type: "cameraMode", cameraMode });
    }

    /**
     * @param {ARSCameraMode} newCameraMode
     * @throws error if newCameraMode is not valid
     */
    async setCameraMode(newCameraMode) {
        this.#assertIsSupported();

        const isValidCameraMode = this.#allCameraModes.includes(newCameraMode);
        console.assert(isValidCameraMode, `invalid cameraMode "${newCameraMode}"`);

        if (newCameraMode == this.#cameraMode) {
            _console.log(`cameraMode is already set to "${this.#cameraMode}"`);
            return;
        }

        _console.log("setting cameraMode...", newCameraMode);
        return sendMessageToApp(this.#setCameraModeMessage(newCameraMode));
    }

    /** @type {boolean} */
    #checkCameraModeOnLoad = false;
    get checkCameraModeOnLoad() {
        return this.#checkCameraModeOnLoad;
    }
    /** @throws {Error} if newValue is not a boolean */
    set checkCameraModeOnLoad(newValue) {
        console.assert(typeof newValue == "boolean", `invalid newValue for checkCameraModeOnLoad`, newValue);
        this.#checkCameraModeOnLoad = newValue;
    }

    /** @param {ARSCameraMode} newCameraMode */
    #onCameraModeUpdated(newCameraMode) {
        if (this.#cameraMode == newCameraMode) {
            return;
        }

        this.#cameraMode = newCameraMode;
        _console.log(`updated cameraMode to ${this.cameraMode}`);
        this.dispatchEvent({ type: "cameraMode", message: { cameraMode: this.cameraMode } });
    }

    /** @type {boolean} */
    #showCamera = null;
    get showCamera() {
        return this.#showCamera;
    }

    async #checkShowCamera() {
        this.#assertIsSupported();

        _console.log("checking showCamera...");
        return sendMessageToApp(this.#checkShowCameraMessage);
    }

    /** @param {boolean} newShowCamera */
    #onShowCameraUpdated(newShowCamera) {
        if (this.#showCamera == newShowCamera) {
            return;
        }

        this.#showCamera = newShowCamera;
        _console.log(`updated showCamera to ${this.showCamera}`);
        this.dispatchEvent({ type: "showCamera", message: { showCamera: this.showCamera } });
    }

    /** @type {boolean} */
    #checkShowCameraOnLoad = false;
    get checkShowCameraOnLoad() {
        return this.#checkShowCameraOnLoad;
    }
    /** @throws {Error} if newValue is not a boolean */
    set checkShowCameraOnLoad(newValue) {
        console.assert(typeof newValue == "boolean", `invalid newValue for checkShowCameraOnLoad`, newValue);
        this.#checkShowCameraOnLoad = newValue;
    }

    /** @param {boolean} newShowCamera */
    async setShowCamera(newShowCamera) {
        this.#assertIsSupported();
        if (newShowCamera == this.#showCamera) {
            _console.log(`showCamera is already set to "${this.#showCamera}"`);
            return;
        }

        _console.log("setting showCamera...", newShowCamera);
        return sendMessageToApp(this.#setShowCameraMessage(newShowCamera));
    }

    get #checkShowCameraMessage() {
        return this._formatMessage({ type: "showCamera" });
    }

    /** @param {boolean} showCamera */
    #setShowCameraMessage(showCamera) {
        return this._formatMessage({ type: "showCamera", showCamera });
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
            case "configuration":
                _console.log("received configuration message", message);
                this.#onConfigurationUpdated(message.configuration);
                break;
            case "debugOptions":
                _console.log("received debugOptions message", message);
                this.#onDebugOptionsUpdated(message.debugOptions);
                break;
            case "cameraMode":
                _console.log("received cameraMode message", message);
                this.#onCameraModeUpdated(message.cameraMode);
                break;
            case "frame":
                _console.log("received frame message", message);
                this.#onFrame(message.frame);
                break;
            case "showCamera":
                _console.log("received showCamera message", message);
                this.#onShowCameraUpdated(message.showCamera);
                break;
            default:
                throw Error(`uncaught message type ${type}`);
        }
    }
}

export default ARSessionManager.shared;

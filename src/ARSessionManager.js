import EventDispatcher from "./utils/EventDispatcher.js";
import { createConsole } from "./utils/Console.js";

import { sendMessageToApp, addAppListener } from "./utils/messaging.js";
import { areObjectsEqual } from "./utils/objectUtils.js";
import { isInApp, isMac, is_iOS } from "./utils/platformUtils.js";

const _console = createConsole("ARSession", { log: false });

/** @typedef {"worldTrackingSupport" | "bodyTrackingSupport" | "faceTrackingSupport" | "run" | "pause" | "status" | "frame" | "debugOptions" | "cameraMode" | "configuration" | "showCamera" | "messageConfiguration" | "isRunning"} ARSMessageType */

/** @typedef {"worldTrackingSupport" | "bodyTrackingSupport" | "faceTrackingSupport" | "isRunning" | "frame" | "camera" | "faceAnchors" | "debugOptions" | "cameraMode" | "configuration" | "showCamera" | "lightEstimate" | "messageConfiguration" | "planeAnchors" | "bodyAnchors"} ARSEventType */

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
 * @typedef ARSBodyTrackingSupport
 * @type {object}
 * @property {boolean} isSupported
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

/** @typedef {"worldTracking"|"faceTracking"|"bodyTracking"} ARSConfigurationType */
/**
 * @typedef ARSConfiguration
 * @type {object}
 * @property {ARSConfigurationType} type
 */

/** @typedef {"userFaceTrackingEnabled" | "planeDetection" | "frameSemantics"} ARSWorldTrackingConfigurationKey */
/**
 * @typedef _ARSWorldTrackingConfiguration
 * @type {object}
 * @property {bool} userFaceTrackingEnabled
 * @property {ARSPlaneDetection[]} planeDetection
 * @property {ARSFrameSemantic[]} frameSemantics
 */
/** @typedef {"horizontal" | "vertical"} ARSPlaneDetection */

/** @typedef {"bodyDetection"} ARSFrameSemantic */

/** @typedef {ARSConfiguration & _ARSWorldTrackingConfiguration} ARSWorldTrackingConfiguration */

/** @typedef {"isWorldTrackingEnabled" | "maximumNumberOfTrackedFaces"} ARSFaceTrackingConfigurationKey */
/**
 * @typedef _ARSFaceTrackingConfiguration
 * @type {object}
 * @property {bool} isWorldTrackingEnabled
 * @property {bool} maximumNumberOfTrackedFaces
 */
/** @typedef {ARSConfiguration & _ARSFaceTrackingConfiguration} ARSFaceTrackingConfiguration */

/** @typedef {"planeDetection" | "frameSemantics"} ARSBodyTrackingConfigurationKey */
/**
 * @typedef _ARSBodyTrackingConfiguration
 * @type {object}
 * @property {ARSPlaneDetection[]} planeDetection
 * @property {ARSFrameSemantic[]} frameSemantics
 */
/** @typedef {ARSConfiguration & _ARSBodyTrackingConfiguration} ARSBodyTrackingConfiguration */

/**
 * @typedef ARSFrame
 * @type {object}
 * @property {number} timestamp
 * @property {ARSCamera} camera
 * @property {ARSFaceAnchor[]?} faceAnchors
 * @property {ARSPlaneAnchor[]?} planeAnchors
 * @property {ARSBodyAnchor[]?} bodyAnchors
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
 * @property {number[]?} lookAtPoint
 * @property {number[]} position
 * @property {number[]} quaternion
 * @property {ARSFaceAnchorEye?} leftEye
 * @property {ARSFaceAnchorEye?} rightEye
 * @property {ARSFaceAnchorBlendShapes?} blendShapes
 * @property {ARSFaceAnchorGeometry?} geometry
 */

/**
 * @typedef ARSFaceAnchorEye
 * @type {object}
 * @property {number[]} quaternion
 * @property {number[]} position
 */

/**
 * @typedef ARSFaceAnchorGeometry
 * @type {object}
 * @property {number[][]} vertices array of 3d vertices
 * @property {number} triangleCount
 * @property {number[]} triangleIndices
 * @property {number[][]} textureCoordinates 2d texture coordinate of each vertex
 */

/**
 * @typedef ARSPlaneAnchor
 * @type {object}
 * @property {string} identifier
 * @property {number[]} position
 * @property {number[]} center
 * @property {number[]} quaternion
 * @property {ARSPlaneClassification} classification
 * @property {ARSPlaneExtent} planeExtent
 */

/** @typedef {"wall" | "floor" | "ceiling" | "table" | "seat" | "window" | "door" | "unknown" | "notAvailable" | "undetermined"} ARSPlaneClassification */

/**
 * @typedef ARSPlaneExtent
 * @type {object}
 * @property {number} height
 * @property {number} width
 * @property {number} rotationOnYAxis
 */

/**
 * @typedef ARSBodyAnchor
 * @type {object}
 * @property {string} identifier
 * @property {number[]} position
 * @property {number[]} quaternion
 * @property {ARSSkeleton} skeleton
 */

/** @typedef {"root" | "hips_joint" | "left_upLeg_joint" | "left_leg_joint" | "left_foot_joint" | "left_toes_joint" | "left_toesEnd_joint" | "right_upLeg_joint" | "right_leg_joint" | "right_foot_joint" | "right_toes_joint" | "right_toesEnd_joint" | "spine_1_joint" | "spine_2_joint" | "spine_3_joint" | "spine_4_joint" | "spine_5_joint" | "spine_6_joint" | "spine_7_joint" | "neck_1_joint" | "neck_2_joint" | "neck_3_joint" | "neck_4_joint" | "head_joint" | "jaw_joint" | "chin_joint" | "nose_joint" | "right_eye_joint" | "right_eyeUpperLid_joint" | "right_eyeLowerLid_joint" | "right_eyeball_joint" | "left_eye_joint" | "left_eyeUpperLid_joint" | "left_eyeLowerLid_joint" | "left_eyeball_joint" | "right_shoulder_1_joint" | "right_arm_joint" | "right_forearm_joint" | "right_hand_joint" | "right_handPinkyStart_joint" | "right_handPinky_1_joint" | "right_handPinky_2_joint" | "right_handPinky_3_joint" | "right_handPinkyEnd_joint" | "right_handRingStart_joint" | "right_handRing_1_joint" | "right_handRing_2_joint" | "right_handRing_3_joint" | "right_handRingEnd_joint" | "right_handMidStart_joint" | "right_handMid_1_joint" | "right_handMid_2_joint" | "right_handMid_3_joint" | "right_handMidEnd_joint" | "right_handIndexStart_joint" | "right_handIndex_1_joint" | "right_handIndex_2_joint" | "right_handIndex_3_joint" | "right_handIndexEnd_joint" | "right_handThumbStart_joint" | "right_handThumb_1_joint" | "right_handThumb_2_joint" | "right_handThumbEnd_joint" | "left_shoulder_1_joint" | "left_arm_joint" | "left_forearm_joint" | "left_hand_joint" | "left_handPinkyStart_joint" | "left_handPinky_1_joint" | "left_handPinky_2_joint" | "left_handPinky_3_joint" | "left_handPinkyEnd_joint" | "left_handRingStart_joint" | "left_handRing_1_joint" | "left_handRing_2_joint" | "left_handRing_3_joint" | "left_handRingEnd_joint" | "left_handMidStart_joint" | "left_handMid_1_joint" | "left_handMid_2_joint" | "left_handMid_3_joint" | "left_handMidEnd_joint" | "left_handIndexStart_joint" | "left_handIndex_1_joint" | "left_handIndex_2_joint" | "left_handIndex_3_joint" | "left_handIndexEnd_joint" | "left_handThumbStart_joint" | "left_handThumb_1_joint" | "left_handThumb_2_joint" | "left_handThumbEnd_joint"} ARSSkeletonJointName */
/**
 * @typedef ARSSkeleton
 * @type {object.<string, ARSSkeletonJoint>}
 */

/**
 * @typedef ARSSkeletonJoint
 * @type {object}
 * @property {number[]} position
 * @property {number[]} quaternion
 */

/** @typedef {"faceAnchorBlendshapes" | "faceAnchorGeometry"} ARSMessageConfigurationType */

/**
 * @typedef ARSMessageConfiguration
 * @type {object}
 * @property {boolean} faceAnchorBlendshapes
 * @property {boolean} faceAnchorGeometry
 * @property {boolean} faceAnchorEyes
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

class ARSessionManager {
    /** @type {ARSEventType[]} */
    static #EventsTypes = [
        "worldTrackingSupport",
        "faceTrackingSupport",
        "bodyTrackingSupport",
        "isRunning",
        "frame",
        "camera",
        "faceAnchors",
        "debugOptions",
        "cameraMode",
        "configuration",
        "showCamera",
        "lightEstimate",
        "messageConfiguration",
        "planeAnchors",
        "bodyAnchors",
    ];
    /** @type {ARSEventType[]} */
    get eventTypes() {
        return ARSessionManager.#EventsTypes;
    }
    #eventDispatcher = new EventDispatcher(this.eventTypes);
    /**
     * @param {ARSEventType} type
     * @param {ARSEventListener} listener
     * @param {EventDispatcherOptions?} options
     */
    addEventListener(type, listener, options) {
        return this.#eventDispatcher.addEventListener(...arguments);
    }
    /**
     * @param {ARSEventType} type
     * @param {ARSEventListener} listener
     * @returns {boolean}
     */
    removeEventListener(type, listener) {
        return this.#eventDispatcher.removeEventListener(...arguments);
    }
    /**
     * @param {ARSEventType} type
     * @param {ARSEventListener} listener
     * @returns {boolean}
     */
    hasEventListener(type, listener) {
        return this.#eventDispatcher.hasEventListener(...arguments);
    }
    /**
     * @param {ARSEvent} event
     */
    dispatchEvent(event) {
        return this.#eventDispatcher.dispatchEvent(...arguments);
    }

    static #shared = new ARSessionManager();
    static get shared() {
        return this.#shared;
    }
    #prefix = "ars";
    /**
     * @param {ARSMessage[]} messages
     * @returns {NKMessage[]}
     */
    #formatMessages(messages) {
        return messages.map((message) => Object.assign({}, message, { type: `${this.#prefix}-${message.type}` }));
    }

    /** @throws {Error} if singleton already exists */
    constructor() {
        _console.assertWithError(!this.shared, "ARSessionManager is a singleton - use ARSessionManager.shared");

        addAppListener(this.#getWindowLoadMessages.bind(this), "window.load");
        addAppListener(this.#onAppMessage.bind(this), this.#prefix);
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
        _console.assertWithError(this.isRunning, "ARSession is not running");
    }

    /**
     * @param {ARSAppMessage} message
     */
    async sendMessageToApp(message) {
        message.type = `${this.#prefix}-${message.type}`;
        return sendMessageToApp(message);
    }

    /** @returns {NKMessage[]} */
    #getWindowLoadMessages() {
        if (!this.isSupported) {
            return;
        }

        /** @type {ARSMessage[]} */
        const messages = [];
        if (this.checkFaceTrackingSupportOnLoad) {
            messages.push({ type: "faceTrackingSupport" });
        }
        if (this.checkWorldTrackingSupportOnLoad) {
            messages.push({ type: "worldTrackingSupport" });
        }
        if (this.checkBodyTrackingSupportOnLoad) {
            messages.push({ type: "bodyTrackingSupport" });
        }
        if (this.checkIsRunningOnLoad) {
            messages.push({ type: "isRunning" });
        }
        if (this.checkDebugOptionsOnLoad) {
            messages.push({ type: "debugOptions" });
        }
        if (this.checkCameraModeOnLoad) {
            messages.push({ type: "cameraMode" });
        }
        if (this.checkShowCameraOnLoad) {
            messages.push({ type: "showCamera" });
        }

        return this.#formatMessages(messages);
    }
    /** @returns {NKMessage[]} */
    #getWindowUnloadMessages() {
        if (!this.isSupported) {
            return;
        }

        /** @type {ARSMessage[]} */
        const messages = [];
        if (this.pauseOnUnload && this.isRunning) {
            messages.push({ type: "pause" });
        }
        return this.#formatMessages(messages);
    }

    /** @type {ARSWorldTrackingSupport} */
    #worldTrackingSupport = {
        isSupported: null,
        supportsUserFaceTracking: null,
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
        _console.assertWithError(
            typeof newValue == "boolean",
            `invalid newValue for checkWorldTrackingSupportOnLoad`,
            newValue
        );
        this.#checkWorldTrackingSupportOnLoad = newValue;
    }

    /** @type {ARSBodyTrackingSupport} */
    #bodyTrackingSupport = {
        isSupported: null,
    };
    get bodyTrackingSupport() {
        return this.#bodyTrackingSupport;
    }
    /** @param {ARSBodyTrackingSupport} newValue */
    #onBodyTrackingSupportUpdated(newValue) {
        if (!areObjectsEqual(this.#bodyTrackingSupport, newValue)) {
            this.#bodyTrackingSupport = newValue;
            _console.log("updated bodyTrackingSupport", newValue);
            this.dispatchEvent({
                type: "bodyTrackingSupport",
                message: { bodyTrackingSupport: this.bodyTrackingSupport },
            });
        }
    }

    /** @type {boolean} */
    #checkBodyTrackingSupportOnLoad = false;
    get checkBodyTrackingSupportOnLoad() {
        return this.#checkBodyTrackingSupportOnLoad;
    }
    /** @throws {Error} if newValue is not a boolean */
    set checkBodyTrackingSupportOnLoad(newValue) {
        _console.assertWithError(
            typeof newValue == "boolean",
            `invalid newValue for checkBodyTrackingSupportOnLoad`,
            newValue
        );
        this.#checkBodyTrackingSupportOnLoad = newValue;
    }

    /** @type {ARSFaceTrackingSupport} */
    #faceTrackingSupport = {
        isSupported: null,
        supportsWorldTracking: null,
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
        _console.assertWithError(
            typeof newValue == "boolean",
            "invalid newValue for checkFaceTrackingSupportOnLoad",
            newValue
        );
        this.#checkFaceTrackingSupportOnLoad = newValue;
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

    /** @type {boolean} */
    #checkIsRunningOnLoad = false;
    get checkIsRunningOnLoad() {
        return this.#checkIsRunningOnLoad;
    }
    /** @throws {Error} if newValue is not a boolean */
    set checkIsRunningOnLoad(newValue) {
        _console.assertWithError(typeof newValue == "boolean", "invalid newValue for checkIsRunningOnLoad", newValue);
        this.#checkIsRunningOnLoad = newValue;
    }

    /** @type {boolean} */
    #pauseOnUnload = true;
    get pauseOnUnload() {
        return this.#pauseOnUnload;
    }
    /** @throws {Error} if newValue is not a boolean */
    set pauseOnUnload(newValue) {
        _console.assertWithError(typeof newValue == "boolean", `invalid newValue for pauseOnUnload`, newValue);
        this.#pauseOnUnload = newValue;
    }

    /**
     * @param {ARSConfiguration} configuration
     * @throws {Error} if invalid
     */
    #assertConfigurationIsValid(configuration) {
        _console.log("assertConfigurationIsValid", configuration);
        _console.assertWithError(configuration, "configuration required to run ARSession");
        _console.assertWithError(configuration.type, '"type" property required in configuration"');
        _console.assertWithError(
            this.allConfigurationTypes.includes(configuration.type),
            `invalid configuration type "${configuration.type}"`
        );

        switch (configuration.type) {
            case "worldTracking":
                const invalidWorldTrackingConfigurationKey = Object.keys(configuration).find(
                    (key) => key !== "type" && !this.#worldTrackingConfigurationKeys.includes(key)
                );
                _console.assertWithError(
                    !invalidWorldTrackingConfigurationKey,
                    `invalid worldTracking configuration key "${invalidWorldTrackingConfigurationKey}"`
                );
                /** @type {ARSWorldTrackingConfiguration} */
                const worldTrackingConfiguration = configuration;
                _console.assertWithError(
                    this.worldTrackingSupport.isSupported != null,
                    "check for world tracking support before running an AR session"
                );
                _console.assertWithError(
                    this.worldTrackingSupport.isSupported,
                    "your device doesn't support world tracking"
                );
                _console.assertWithError(
                    !worldTrackingConfiguration.userFaceTrackingEnabled ||
                        this.worldTrackingSupport.supportsUserFaceTracking,
                    "your device doesn't support user face tracking with world tracking"
                );
                break;
            case "faceTracking":
                const invalidFaceTrackingConfigurationKey = Object.keys(configuration).find(
                    (key) => key !== "type" && !this.#faceTrackingConfigurationKeys.includes(key)
                );
                _console.assertWithError(
                    !invalidFaceTrackingConfigurationKey,
                    `invalid faceTracking configuration key "${invalidFaceTrackingConfigurationKey}"`
                );
                /** @type {ARSFaceTrackingConfiguration} */
                const faceTrackingConfiguration = configuration;
                _console.assertWithError(
                    this.#faceTrackingSupport.isSupported != null,
                    "check for face tracking support before running an AR session"
                );
                _console.assertWithError(
                    this.faceTrackingSupport.isSupported,
                    "your device doesn't support face tracking"
                );
                _console.assertWithError(
                    !faceTrackingConfiguration.isWorldTrackingEnabled || this.faceTrackingSupport.supportsWorldTracking,
                    "your device doesn't support user world tracking with face tracking"
                );
                break;
            case "bodyTracking":
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
        return this.sendMessageToApp({ type: "run", configuration });
    }

    async pause() {
        _console.log("pause...");
        return this.sendMessageToApp({ type: "pause" });
    }

    /** @type {ARSConfigurationType[]} */
    #allConfigurationTypes = ["worldTracking", "faceTracking", "bodyTracking"];
    get allConfigurationTypes() {
        return this.#allConfigurationTypes;
    }

    /** @type {ARSWorldTrackingConfigurationKey[]} */
    #worldTrackingConfigurationKeys = ["userFaceTrackingEnabled", "planeDetection", "frameSemantics"];
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
        return this.sendMessageToApp({ type: "configuration" });
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
    /** @param {ARSFrame} frame */
    #onFrame(frame) {
        this.#frame = frame;
        _console.log("received frame", this.frame);
        this.dispatchEvent({ type: "frame", message: { frame: this.frame } });
        this.#onCamera(frame.camera);
        if (frame.lightEstimate) {
            this.#onLightEstimate(frame.lightEstimate);
        }
        // dispatch messages so we can detect no anchors that frame
        if (true || frame.faceAnchors) {
            this.#onFaceAnchors(frame.faceAnchors || []);
        }
        if (true || frame.planeAnchors) {
            this.#onPlaneAnchors(frame.planeAnchors || []);
        }
        if (true || frame.bodyAnchors) {
            this.#onBodyAnchors(frame.bodyAnchors || []);
        }
    }

    /** @type {ARSCamera?} */
    #camera = null;
    get camera() {
        return this.#camera;
    }
    /** @param {ARSCamera} camera */
    #onCamera(camera) {
        this.#camera = camera;
        _console.log("received camera", this.camera);
        this.dispatchEvent({ type: "camera", message: { camera: this.camera } });
    }

    /** @type {ARSLightEstimate?} */
    #lightEstimate = null;
    get lightEstimate() {
        return this.#lightEstimate;
    }
    /** @param {ARSLightEstimate} lightEstimate */
    #onLightEstimate(lightEstimate) {
        this.#lightEstimate = lightEstimate;
        _console.log("received lightEstimate", this.lightEstimate);
        this.dispatchEvent({ type: "lightEstimate", message: { lightEstimate: this.lightEstimate } });
    }

    /** @type {ARSFaceAnchor[]?} */
    #faceAnchors = null;
    get faceAnchors() {
        return this.#faceAnchors;
    }
    /** @param {ARSFaceAnchor[]} faceAnchors */
    #onFaceAnchors(faceAnchors) {
        this.#faceAnchors = faceAnchors;
        _console.log("received faceAnchors", this.faceAnchors);
        this.dispatchEvent({ type: "faceAnchors", message: { faceAnchors: this.faceAnchors } });
    }

    /** @type {ARSPlaneAnchor[]?} */
    #planeAnchors = null;
    get planeAnchors() {
        return this.#planeAnchors;
    }
    /** @param {ARSPlaneAnchor[]} planeAnchors */
    #onPlaneAnchors(planeAnchors) {
        this.#planeAnchors = planeAnchors;
        _console.log("received planeAnchors", this.planeAnchors);
        this.dispatchEvent({ type: "planeAnchors", message: { planeAnchors: this.planeAnchors } });
    }

    /** @type {ARSBodyAnchor[]?} */
    #bodyAnchors = null;
    get bodyAnchors() {
        return this.#bodyAnchors;
    }
    /** @param {ARSBodyAnchor[]} bodyAnchors */
    #onBodyAnchors(bodyAnchors) {
        this.#bodyAnchors = bodyAnchors;
        _console.log("received bodyAnchors", this.bodyAnchors);
        this.dispatchEvent({ type: "bodyAnchors", message: { bodyAnchors: this.bodyAnchors } });
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

    /**
     * @param {ARSDebugOptions} newDebugOptions
     * @throws if debugOptions is not an object or has an invalid key
     */
    async setDebugOptions(newDebugOptions) {
        this.#assertIsSupported();
        _console.assertWithError(typeof newDebugOptions == "object", "debugOptions must be an object", newDebugOptions);
        const invalidKey = Object.keys(newDebugOptions).find(
            (debugOption) => !this.#allDebugOptions.includes(debugOption)
        );
        _console.assertWithError(!invalidKey, `invalid debugOptions key ${invalidKey}`);

        _console.log("setting debugOptions...", newDebugOptions);
        return this.sendMessageToApp({ type: "debugOptions", debugOptions: newDebugOptions });
    }

    /** @type {boolean} */
    #checkDebugOptionsOnLoad = false;
    get checkDebugOptionsOnLoad() {
        return this.#checkDebugOptionsOnLoad;
    }
    /** @throws {Error} if newValue is not a boolean */
    set checkDebugOptionsOnLoad(newValue) {
        _console.assertWithError(
            typeof newValue == "boolean",
            `invalid newValue for checkDebugOptionsOnLoad`,
            newValue
        );
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

    /**
     * @param {ARSCameraMode} newCameraMode
     * @throws error if newCameraMode is not valid
     */
    async setCameraMode(newCameraMode) {
        this.#assertIsSupported();

        const isValidCameraMode = this.#allCameraModes.includes(newCameraMode);
        _console.assertWithError(isValidCameraMode, `invalid cameraMode "${newCameraMode}"`);

        if (newCameraMode == this.#cameraMode) {
            _console.log(`cameraMode is already set to "${this.#cameraMode}"`);
            return;
        }

        _console.log("setting cameraMode...", newCameraMode);
        return this.sendMessageToApp({ type: "cameraMode", cameraMode: newCameraMode });
    }

    /** @type {boolean} */
    #checkCameraModeOnLoad = false;
    get checkCameraModeOnLoad() {
        return this.#checkCameraModeOnLoad;
    }
    /** @throws {Error} if newValue is not a boolean */
    set checkCameraModeOnLoad(newValue) {
        _console.assertWithError(typeof newValue == "boolean", `invalid newValue for checkCameraModeOnLoad`, newValue);
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
        _console.assertWithError(typeof newValue == "boolean", `invalid newValue for checkShowCameraOnLoad`, newValue);
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
        return this.sendMessageToApp({ type: "showCamera", showCamera: newShowCamera });
    }

    /** @type {ARSMessageConfiguration} */
    #messageConfiguration = {
        faceAnchorBlendshapes: false,
        faceAnchorGeometry: false,
        faceAnchorEyes: false,
    };
    get messageConfiguration() {
        return this.#messageConfiguration;
    }
    /** @param {ARSMessageConfiguration} newMessageConfiguration */
    async setMessageConfiguration(newMessageConfiguration) {
        this.#assertIsSupported();
        _console.log("setting messageConfiguration...", newMessageConfiguration);
        return this.sendMessageToApp({ type: "messageConfiguration", messageConfiguration: newMessageConfiguration });
    }
    /** @param {ARSMessageConfiguration} newMessageConfiguration */
    #onMessageConfigurationUpdated(newMessageConfiguration) {
        this.#messageConfiguration = newMessageConfiguration;
        _console.log("updated messageConfiguration", this.messageConfiguration);
        this.dispatchEvent({
            type: "messageConfiguration",
            message: { messageConfiguration: this.messageConfiguration },
        });
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
            case "bodyTrackingSupport":
                _console.log("received bodyTrackingSupport message", message);
                this.#onBodyTrackingSupportUpdated(message.bodyTrackingSupport);
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
            case "messageConfiguration":
                _console.log("received messageConfiguration message", message);
                this.#onMessageConfigurationUpdated(message.messageConfiguration);
                break;
            default:
                throw Error(`uncaught message type ${type}`);
        }
    }
}

export default ARSessionManager.shared;

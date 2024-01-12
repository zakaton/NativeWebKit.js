import { ARSessionManager, utils } from "../../../src/NativeWebKit.js";
//import { ARSessionManager } from "../../../build/nativewebkit.module.js";
window.ARSessionManager = ARSessionManager;
console.log(ARSessionManager);

ARSessionManager.checkFaceTrackingSupportOnLoad = true;
ARSessionManager.checkIsRunningOnLoad = true;
ARSessionManager.pauseOnUnload = false;
ARSessionManager.checkDebugOptionsOnLoad = true;
ARSessionManager.checkCameraModeOnLoad = true;
ARSessionManager.checkShowCameraOnLoad = true;

const scene = document.querySelector("a-scene");

/** @type {HTMLInputElement} */
const isSupportedCheckbox = document.getElementById("isSupported");
isSupportedCheckbox.checked = ARSessionManager.isSupported;

if (ARSessionManager.isSupported) {
    ARSessionManager.setCameraMode("ar");
}

/** @type {HTMLInputElement} */
const isFaceTrackingSupportedCheckbox = document.getElementById("isFaceTrackingSupported");
ARSessionManager.addEventListener("faceTrackingSupport", (event) => {
    /** @type {import("../../../src/ARSessionManager.js").ARSFaceTrackingSupport} */
    const faceTrackingSupport = event.message.faceTrackingSupport;
    console.log("faceTrackingSupport", faceTrackingSupport);
    isFaceTrackingSupportedCheckbox.checked = faceTrackingSupport.isSupported;
});

/** @typedef {import("../../../src/ARSessionManager.js").ARSConfigurationType} ARSConfigurationType */
/** @typedef {import("../../../src/ARSessionManager.js").ARSConfiguration} ARSConfiguration */

/** @type {import("../../../src/ARSessionManager.js").ARSFaceTrackingConfiguration} */
var configuration = { type: "faceTracking", isWorldTrackingEnabled: false };

/** @type {HTMLButtonElement} */
const runButton = document.getElementById("run");
runButton.addEventListener("click", () => {
    ARSessionManager.run(configuration);
});
runButton.disabled = !ARSessionManager.isSupported;

/** @type {HTMLButtonElement} */
const pauseButton = document.getElementById("pause");
pauseButton.addEventListener("click", () => {
    ARSessionManager.pause();
});
pauseButton.disabled = true;

ARSessionManager.addEventListener("isRunning", (event) => {
    /** @type {Boolean} */
    const isRunning = event.message.isRunning;
    console.log("isRunning", isRunning);

    eyeTrackingCursor.style.display = isRunning ? "block" : "none";

    runButton.disabled = isRunning;
    pauseButton.disabled = !isRunning;
});

/** @typedef {import("../../../src/ARSessionManager.js").ARSDebugOptions} ARSDebugOptions */
var isDebugEnabled = false;
/** @type {HTMLButtonElement} */
const toggleDebugButton = document.getElementById("toggleDebug");
toggleDebugButton.addEventListener("click", () => {
    const newIsDebugEnabled = !isDebugEnabled;
    ARSessionManager.setDebugOptions({
        showAnchorOrigins: newIsDebugEnabled,
    });
});
toggleDebugButton.disabled = !ARSessionManager.isSupported;

ARSessionManager.addEventListener("debugOptions", (event) => {
    /** @type {ARSDebugOptions} */
    const debugOptions = event.message.debugOptions;
    console.log("debugOptions", debugOptions);
    isDebugEnabled = debugOptions.showAnchorOrigins;
    toggleDebugButton.innerText = isDebugEnabled ? "hide debug" : "show debug";
});

/** @type {HTMLButtonElement} */
const toggleShowCameraButton = document.getElementById("toggleShowCamera");
toggleShowCameraButton.addEventListener("click", () => {
    ARSessionManager.setShowCamera(!ARSessionManager.showCamera);
});
toggleShowCameraButton.disabled = !ARSessionManager.isSupported;

ARSessionManager.addEventListener("showCamera", (event) => {
    /** @type {boolean} */
    const showCamera = event.message.showCamera;
    console.log("showCamera", showCamera);
    toggleShowCameraButton.innerText = showCamera ? "hide camera" : "show camera";
});

/** @typedef {import("../../src/three/three.module.min.js").Vector2} Vector2 */
/** @typedef {import("../../src/three/three.module.min.js").Vector3} Vector3 */
/** @typedef {import("../../src/three/three.module.min.js").Quaternion} Quaternion */
/** @typedef {import("../../src/three/three.module.min.js").Euler} Euler */
/** @typedef {import("../../src/three/three.module.min.js").Matrix4} Matrix4 */
/** @typedef {import("../../src/three/three.module.min.js").Box2} Box2 */

/** @type {Matrix4} */
const aframeCamera = document.getElementById("camera");
var threeCamera;
aframeCamera.addEventListener("loaded", () => {
    threeCamera = aframeCamera?.components?.camera?.camera;
    console.log("threeCamera", threeCamera);
});
var latestFocalLength;
ARSessionManager.addEventListener("camera", (event) => {
    /** @type {import("../../../src/ARSessionManager.js").ARSCamera} */
    const camera = event.message.camera;

    aframeCamera.object3D.position.set(...camera.position);

    if (ARSessionManager.cameraMode == "ar") {
        const quaternion = new THREE.Quaternion(...camera.quaternion);
        aframeCamera.object3D.quaternion.copy(quaternion);
    } else {
        /** @type {Euler} */
        const euler = new THREE.Euler(...camera.eulerAngles);
        euler.z += Math.PI / 2;
        aframeCamera.object3D.rotation.copy(euler);
    }

    if (threeCamera) {
        if (latestFocalLength != camera.focalLength) {
            threeCamera.setFocalLength(camera.focalLength);
            latestFocalLength = camera.focalLength;
        }
    }

    scene.renderer.toneMappingExposure = camera.exposureOffset;
});

var eyeBlinkThreshold = 0.5;

/** @typedef {import("../../../src/ARSessionManager.js").ARSFaceAnchor} ARSFaceAnchor */
ARSessionManager.addEventListener("faceAnchors", (event) => {
    /** @type {ARSFaceAnchor[]} */
    const faceAnchors = event.message.faceAnchors;
    const faceAnchor = faceAnchors[0];
    if (faceAnchor) {
        const isLeftEyeClosed = faceAnchor.blendShapes.eyeBlinkLeft > eyeBlinkThreshold;
        const isRightEyeClosed = faceAnchor.blendShapes.eyeBlinkRight > eyeBlinkThreshold;

        // FILL -
    }
});

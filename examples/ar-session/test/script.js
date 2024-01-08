import { ARSessionManager, utils } from "../../../src/NativeWebKit.js";
//import { ARSessionManager } from "../../../build/nativewebkit.module.js";
console.log(ARSessionManager);
window.utils = utils;
window.ARSessionManager = ARSessionManager;

ARSessionManager.checkFaceTrackingSupportOnLoad = true;
ARSessionManager.checkWorldTrackingSupportOnLoad = true;
ARSessionManager.checkIsRunningOnLoad = true;
ARSessionManager.pauseOnUnload = true;

/** @type {HTMLInputElement} */
const isSupportedCheckbox = document.getElementById("isSupported");
isSupportedCheckbox.checked = ARSessionManager.isSupported;

/** @type {HTMLInputElement} */
const isWorldTrackingSupportedCheckbox = document.getElementById("isWorldTrackingSupported");
/** @type {HTMLInputElement} */
const isWorldTrackingSupportedWithUserFaceTrackingCheckbox = document.getElementById(
    "isWorldTrackingSupportedWithUserFaceTracking"
);
ARSessionManager.addEventListener("worldTrackingSupport", (event) => {
    /** @type {import("../../../src/ARSessionManager.js").ARSWorldTrackingSupport} */
    const worldTrackingSupport = event.message.worldTrackingSupport;
    isWorldTrackingSupportedCheckbox.checked = worldTrackingSupport.isSupported;
    isWorldTrackingSupportedWithUserFaceTrackingCheckbox.checked = worldTrackingSupport.supportsUserFaceTracking;
});

/** @type {HTMLInputElement} */
const isFaceTrackingSupportedCheckbox = document.getElementById("isFaceTrackingSupported");
/** @type {HTMLInputElement} */
const isFaceTrackingSupportedWithWorldTrackingCheckbox = document.getElementById(
    "isFaceTrackingSupportedWithWorldTracking"
);
ARSessionManager.addEventListener("faceTrackingSupport", (event) => {
    /** @type {import("../../../src/ARSessionManager.js").ARSFaceTrackingSupport} */
    const faceTrackingSupport = event.message.faceTrackingSupport;
    isFaceTrackingSupportedCheckbox.checked = faceTrackingSupport.isSupported;
    isFaceTrackingSupportedWithWorldTrackingCheckbox.checked = faceTrackingSupport.supportsWorldTracking;
});

/** @type {HTMLButtonElement} */
const runButton = document.getElementById("run");
runButton.addEventListener("click", () => {
    ARSessionManager.run();
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

    runButton.disabled = isRunning;
    pauseButton.disabled = !isRunning;
});

/** @type {HTMLSpanElement} */
const cameraPositionSpan = document.getElementById("cameraPosition");
/** @type {HTMLSpanElement} */
const cameraQuaternionSpan = document.getElementById("cameraQuaternion");
/** @type {HTMLSpanElement} */
const cameraEulerAnglesSpan = document.getElementById("cameraEulerAngles");

ARSessionManager.addEventListener("camera", (event) => {
    /** @type {import("../../../src/ARSessionManager.js").ARSCamera} */
    const camera = event.message.camera;
    console.log("camera", camera);

    cameraPositionSpan.innerText = camera.position.map((value) => value.toFixed(3));
    cameraQuaternionSpan.innerText = camera.quaternion.map((value) => value.toFixed(3));
    cameraEulerAnglesSpan.innerText = camera.eulerAngles.map((value) => value.toFixed(3));
});

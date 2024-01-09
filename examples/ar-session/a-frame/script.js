import { ARSessionManager, utils } from "../../../src/NativeWebKit.js";
//import { ARSessionManager } from "../../../build/nativewebkit.module.js";
window.ARSessionManager = ARSessionManager;
console.log(ARSessionManager);

ARSessionManager.checkWorldTrackingSupportOnLoad = true;
ARSessionManager.checkIsRunningOnLoad = true;
ARSessionManager.pauseOnUnload = false;
ARSessionManager.checkDebugOptionsOnLoad = true;
ARSessionManager.checkCameraModeOnLoad = true;

/** @type {HTMLInputElement} */
const isSupportedCheckbox = document.getElementById("isSupported");
isSupportedCheckbox.checked = ARSessionManager.isSupported;

if (ARSessionManager.isSupported) {
    //ARSessionManager.setCameraMode("nonAR");
}

/** @type {HTMLInputElement} */
const isWorldTrackingSupportedCheckbox = document.getElementById("isWorldTrackingSupported");
ARSessionManager.addEventListener("worldTrackingSupport", (event) => {
    /** @type {import("../../../src/ARSessionManager.js").ARSWorldTrackingSupport} */
    const worldTrackingSupport = event.message.worldTrackingSupport;
    console.log("worldTrackingSupport", worldTrackingSupport);
    isWorldTrackingSupportedCheckbox.checked = worldTrackingSupport.isSupported;
});

/** @typedef {import("../../../src/ARSessionManager.js").ARSConfigurationType} ARSConfigurationType */
/** @typedef {import("../../../src/ARSessionManager.js").ARSConfiguration} ARSConfiguration */

/** @type {ARSConfiguration} */
var configuration = { type: "worldTracking" };

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

    runButton.disabled = isRunning;
    pauseButton.disabled = !isRunning;
});

const aframeCamera = document.getElementById("camera");
ARSessionManager.addEventListener("camera", (event) => {
    /** @type {import("../../../src/ARSessionManager.js").ARSCamera} */
    const camera = event.message.camera;
    console.log("camera data", camera);
    aframeCamera.object3D.position.set(...camera.position);
    aframeCamera.object3D.quaternion.set(...camera.quaternion);
});

import { ARSessionManager } from "../../../src/NativeWebKit.js";
//import { ARSessionManager } from "../../../build/nativewebkit.module.js";
window.ARSessionManager = ARSessionManager;
console.log(ARSessionManager);

ARSessionManager.checkBodyTrackingSupportOnLoad = true;
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
    ARSessionManager.setMessageConfiguration({ faceAnchorBlendshapes: true });
}

/** @type {HTMLInputElement} */
const isBodyTrackingSupportedCheckbox = document.getElementById("isBodyTrackingSupported");
ARSessionManager.addEventListener("bodyTrackingSupport", (event) => {
    /** @type {import("../../../src/ARSessionManager.js").ARSBodyTrackingSupport} */
    const bodyTrackingSupport = event.message.bodyTrackingSupport;
    console.log("bodyTrackingSupport", bodyTrackingSupport);
    isBodyTrackingSupportedCheckbox.checked = bodyTrackingSupport.isSupported;
});

/** @typedef {import("../../../src/ARSessionManager.js").ARSConfigurationType} ARSConfigurationType */
/** @typedef {import("../../../src/ARSessionManager.js").ARSConfiguration} ARSConfiguration */
/** @typedef {import("../../../src/ARSessionManager.js").ARSBodyTrackingConfiguration} ARSBodyTrackingConfiguration */

/** @type {ARSBodyTrackingConfiguration} */
var configuration = { type: "bodyTracking" };

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

/** @typedef {import("../../../src/ARSessionManager.js").ARSDebugOptions} ARSDebugOptions */
var isDebugEnabled = false;
/** @type {HTMLButtonElement} */
const toggleDebugButton = document.getElementById("toggleDebug");
toggleDebugButton.addEventListener("click", () => {
    const newIsDebugEnabled = !isDebugEnabled;
    ARSessionManager.setDebugOptions({
        showAnchorGeometry: newIsDebugEnabled,
        showFeaturePoints: newIsDebugEnabled,
    });
});
toggleDebugButton.disabled = !ARSessionManager.isSupported;

ARSessionManager.addEventListener("debugOptions", (event) => {
    /** @type {ARSDebugOptions} */
    const debugOptions = event.message.debugOptions;
    console.log("debugOptions", debugOptions);
    isDebugEnabled = debugOptions.showFeaturePoints;
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

const bodyEntityBones = {};
const bodyEntity = document.getElementById("body");
bodyEntity.addEventListener("model-loaded", (event) => {
    const model = bodyEntity.components["gltf-model"].model;
    model.traverse((object) => {
        if (object.type == "Bone") {
            const bone = object;
            bodyEntityBones[bone.name] = bone;
        }
    });
    console.log(bodyEntityBones);
});

/** @typedef {import("../../../src/ARSessionManager.js").ARSBodyAnchor} ARSBodyAnchor */
ARSessionManager.addEventListener("bodyAnchors", (event) => {
    /** @type {ARSBodyAnchor[]} */
    const bodyAnchors = event.message.bodyAnchors;

    const bodyAnchor = bodyAnchors[0];
    if (bodyAnchor) {
        console.log("bodyAnchor", bodyAnchor);
        var x = bodyAnchor.skeleton["hey"];
    }
});

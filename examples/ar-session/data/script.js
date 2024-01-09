import { ARSessionManager, utils } from "../../../src/NativeWebKit.js";
import { sortObjectKeysAlphabetically } from "../../../src/utils/objectUtils.js";
//import { ARSessionManager } from "../../../build/nativewebkit.module.js";
console.log(ARSessionManager);
window.utils = utils;
window.ARSessionManager = ARSessionManager;

ARSessionManager.checkFaceTrackingSupportOnLoad = true;
ARSessionManager.checkWorldTrackingSupportOnLoad = true;
ARSessionManager.checkIsRunningOnLoad = true;
ARSessionManager.pauseOnUnload = false;
ARSessionManager.checkDebugOptionsOnLoad = true;
ARSessionManager.checkCameraModeOnLoad = true;

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

/** @type {HTMLPreElement} */
const frameElement = document.getElementById("frame");
ARSessionManager.addEventListener("frame", (event) => {
    /** @type {import("../../../src/ARSessionManager.js").ARSFrame} */
    const frame = event.message.frame;
    const sortedFrame = sortObjectKeysAlphabetically(frame);
    frameElement.textContent = JSON.stringify(sortedFrame, null, 2);
});

/** @typedef {import("../../../src/ARSessionManager.js").ARSDebugOption} ARSDebugOption */
/** @typedef {import("../../../src/ARSessionManager.js").ARSDebugOptions} ARSDebugOptions */

/** @type {HTMLDivElement} */
const debugOptionsDiv = document.getElementById("debugOptions");
/** @type {Map.<ARSDebugOption, HTMLInputElement}*/
const debugOptionCheckboxes = new Map();
ARSessionManager.allDebugOptions.forEach((debugOption) => {
    const checkboxLabel = document.createElement("label");
    checkboxLabel.textContent = `${debugOption}? `;
    const checkboxInput = document.createElement("input");
    checkboxInput.type = "checkbox";
    checkboxInput.disabled = !ARSessionManager.isSupported;
    checkboxInput.addEventListener("input", () => {
        const enabled = checkboxInput.checked;
        ARSessionManager.setDebugOptions({ [debugOption]: enabled });
    });

    debugOptionCheckboxes.set(debugOption, checkboxInput);

    checkboxLabel.appendChild(checkboxInput);
    debugOptionsDiv.appendChild(checkboxLabel);
});

ARSessionManager.addEventListener("debugOptions", (event) => {
    /** @type {ARSDebugOptions} */
    const debugOptions = event.message.debugOptions;
    for (const debugOption in debugOptions) {
        const checkboxInput = debugOptionCheckboxes.get(debugOption);
        if (checkboxInput && checkboxInput.checked != debugOptions[debugOption]) {
            checkboxInput.checked = debugOptions[debugOption];
        }
    }
});

/** @typedef {import("../../../src/ARSessionManager.js").ARSCameraMode} ARSCameraMode */

/** @type {HTMLSelectElement} */
const cameraModeSelect = document.getElementById("cameraMode");
const cameraModeOptgroup = cameraModeSelect.querySelector("optgroup");
cameraModeSelect.addEventListener("input", () => {
    /** @type {ARSCameraMode} */
    const cameraMode = cameraModeSelect.value;
    console.log(`setting camera mode to ${cameraMode}`);
    ARSessionManager.setCameraMode(cameraMode);
});
cameraModeSelect.disabled = !ARSessionManager.isSupported;

ARSessionManager.allCameraModes.forEach((cameraMode) => {
    cameraModeOptgroup.appendChild(new Option(cameraMode));
});

ARSessionManager.addEventListener("cameraMode", (event) => {
    /** @type {ARSCameraMode} */
    const cameraMode = event.message.cameraMode;
    cameraModeSelect.value = cameraMode;
});

/** @typedef {import("../../../src/ARSessionManager.js").ARSConfigurationType} ARSConfigurationType */
/** @typedef {import("../../../src/ARSessionManager.js").ARSConfiguration} ARSConfiguration */

/** @type {ARSConfiguration} */
var configuration = { type: ARSessionManager.allConfigurationTypes[0] };

/** @type {HTMLSelectElement} */
const configurationTypeSelect = document.getElementById("configurationType");
const configurationTypeOptgroup = configurationTypeSelect.querySelector("optgroup");
configurationTypeSelect.addEventListener("input", () => {
    /** @type {ARSConfigurationType} */
    const configurationType = configurationTypeSelect.value;
    configuration.type = configurationType;
    console.log("updated configurationType", configurationType);
    if (ARSessionManager.isRunning) {
        ARSessionManager.run(configuration);
    }
});
configurationTypeSelect.disabled = !ARSessionManager.isSupported;

ARSessionManager.allConfigurationTypes.forEach((configurationType) => {
    configurationTypeOptgroup.appendChild(new Option(configurationType));
});

ARSessionManager.addEventListener("configuration", (event) => {
    /** @type {ARSConfiguration} */
    const configuration = event.message.configuration;
    configurationTypeSelect.value = configuration.type;
});

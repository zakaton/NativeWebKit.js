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

/** @typedef {import("../../src/three/three.module.min.js").Vector3} Vector3 */
/** @typedef {import("../../src/three/three.module.min.js").Euler} Euler */
/** @typedef {import("../../src/three/three.module.min.js").Quaternion} Quaternion */
/** @typedef {import("../../src/three/three.module.min.js").PerspectiveCamera} PerspectiveCamera */

const aframeCamera = document.getElementById("camera");
/** @type {PerspectiveCamera} */
var threeCamera;
const cameraPositionSpan = document.getElementById("cameraPosition");

/** @type {Vector3} */
const cameraPosition = new THREE.Vector3();
/** @type {Quaternion} */
const cameraQuaternion = new THREE.Quaternion();

var latestFocalLength;
ARSessionManager.addEventListener("camera", (event) => {
    /** @type {import("../../../src/ARSessionManager.js").ARSCamera} */
    const camera = event.message.camera;
    //console.log("camera data", camera);

    cameraPosition.set(...camera.position);
    cameraQuaternion.set(...camera.quaternion);

    aframeCamera.object3D.position.copy(cameraPosition);
    aframeCamera.object3D.quaternion.copy(cameraQuaternion);

    cameraPositionSpan.innerText = cameraPosition
        .toArray()
        .map((v) => v.toFixed(3))
        .join(",");

    threeCamera = threeCamera || aframeCamera?.components?.camera?.camera;
    if (threeCamera) {
        if (latestFocalLength != camera.focalLength) {
            threeCamera.setFocalLength(camera.focalLength * 1.14);
            latestFocalLength = camera.focalLength;
        }
    }

    scene.renderer.toneMappingExposure = camera.exposureOffset;
});

const sky = document.querySelector("a-sky");
ARSessionManager.addEventListener("showCamera", (event) => {
    /** @type {boolean} */
    const showCamera = event.message.showCamera;
    console.log("showCamera", showCamera);
    const newVisible = !showCamera;
    if (newVisible != sky.object3D.visible) {
        sky.object3D.visible = newVisible;
    }
});

const bodyEntityBones = {};
window.bodyEntityBones = bodyEntityBones;
const bodyEntity = document.getElementById("body");
bodyEntity.addEventListener("model-loaded", () => {
    const model = bodyEntity.components["gltf-model"].model;
    model.traverse((object) => {
        if (object.type == "Bone") {
            const bone = object;
            bodyEntityBones[bone.name] = bone;
        }
    });
    console.log(bodyEntityBones);
});

/** @type {Vector3} */
const _position = new THREE.Vector3();
/** @type {Vector3} */
const _scale = new THREE.Vector3();
/** @type {Quaternion} */
const _quaternion = new THREE.Quaternion();

const bodyPositionSpan = document.getElementById("bodyPosition");
var latestEstimatedScaleFactor;

/** @typedef {import("../../../src/ARSessionManager.js").ARSBodyAnchor} ARSBodyAnchor */
ARSessionManager.addEventListener("bodyAnchors", (event) => {
    /** @type {ARSBodyAnchor[]} */
    const bodyAnchors = event.message.bodyAnchors;

    const bodyAnchor = bodyAnchors[0];
    if (bodyAnchor) {
        //console.log("bodyAnchor", bodyAnchor);

        _position.set(...bodyAnchor.position);
        _quaternion.set(...bodyAnchor.quaternion);

        bodyEntity.object3D.position.lerp(_position, 0.5);
        bodyEntity.object3D.quaternion.slerp(_quaternion, 0.5);

        if (latestEstimatedScaleFactor != bodyAnchor.estimatedScaleFactor) {
            _scale.setScalar(bodyAnchor.estimatedScaleFactor);
            bodyEntity.object3D.scale.copy(_scale);
            latestEstimatedScaleFactor = bodyAnchor.estimatedScaleFactor;
        }

        bodyPositionSpan.innerText = _position
            .toArray()
            .map((v) => v.toFixed(3))
            .join(",");

        Object.entries(bodyAnchor.skeleton).forEach(([boneName, joint]) => {
            const bodyEntityBone = bodyEntityBones[boneName];
            if (bodyEntityBone) {
                _position.set(...joint.position);
                _quaternion.set(...joint.quaternion);

                //bodyEntityBone.position.lerp(_position, 0.5);
                bodyEntityBone.quaternion.slerp(_quaternion, 0.5);
            } else {
                console.error(`"${boneName}" bone not found in entity`);
            }
        });
    }
});

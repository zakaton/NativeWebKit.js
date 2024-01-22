import { ARSessionManager, utils } from "../../../src/NativeWebKit.js";
//import { ARSessionManager } from "../../../build/nativewebkit.module.js";
window.ARSessionManager = ARSessionManager;
console.log(ARSessionManager);

ARSessionManager.checkFaceTrackingSupportOnLoad = true;
ARSessionManager.checkWorldTrackingSupportOnLoad = true;
ARSessionManager.checkIsRunningOnLoad = true;
ARSessionManager.pauseOnUnload = true;
ARSessionManager.checkDebugOptionsOnLoad = true;
ARSessionManager.checkCameraModeOnLoad = true;
ARSessionManager.checkShowCameraOnLoad = true;

const scene = document.querySelector("a-scene");

/** @type {HTMLInputElement} */
const isSupportedCheckbox = document.getElementById("isSupported");
isSupportedCheckbox.checked = ARSessionManager.isSupported;

if (ARSessionManager.isSupported) {
    //ARSessionManager.setCameraMode("nonAR");
}

/** @type {HTMLInputElement} */
const isWorldTrackingSupportedWithFaceTrackingCheckbox = document.getElementById(
    "isWorldTrackingSupportedWithFaceTracking"
);
ARSessionManager.addEventListener("worldTrackingSupport", (event) => {
    /** @type {import("../../../src/ARSessionManager.js").ARSWorldTrackingSupport} */
    const worldTrackingSupport = event.message.worldTrackingSupport;
    console.log("worldTrackingSupport", worldTrackingSupport);
    isWorldTrackingSupportedWithFaceTrackingCheckbox.checked =
        worldTrackingSupport.isSupported && worldTrackingSupport.supportsUserFaceTracking;
});
/** @type {HTMLInputElement} */
const isFaceTrackingSupportedWithWorldTrackingCheckbox = document.getElementById(
    "isFaceTrackingSupportedWithWorldTracking"
);
ARSessionManager.addEventListener("faceTrackingSupport", (event) => {
    /** @type {import("../../../src/ARSessionManager.js").ARSFaceTrackingSupport} */
    const faceTrackingSupport = event.message.faceTrackingSupport;
    console.log("faceTrackingSupper", faceTrackingSupport);
    isFaceTrackingSupportedWithWorldTrackingCheckbox.checked =
        faceTrackingSupport.isSupported && faceTrackingSupport.supportsWorldTracking;
});

/** @type {"faceTracking" | "worldTracking"} */
var configurationType;

/** @type {HTMLSelectElement} */
const configurationTypeSelect = document.getElementById("configurationType");
configurationTypeSelect.addEventListener("input", () => {
    configurationType = configurationTypeSelect.value;
    console.log("configurationType", configurationType);
    if (ARSessionManager.isRunning) {
        runARSession();
    }

    if (configurationType == "worldTracking") {
        togglePlaneDetectionButton.removeAttribute("hidden");
    } else {
        togglePlaneDetectionButton.setAttribute("hidden", "");
    }
});
configurationType = configurationTypeSelect.value;
ARSessionManager.addEventListener("configuration", () => {
    configurationTypeSelect.value = ARSessionManager.configuration.type;
});

/** @typedef {import("../../../src/ARSessionManager.js").ARSConfigurationType} ARSConfigurationType */
/** @typedef {import("../../../src/ARSessionManager.js").ARSConfiguration} ARSConfiguration */
/** @typedef {import("../../../src/ARSessionManager.js").ARSWorldTrackingConfiguration} ARSWorldTrackingConfiguration */
/** @typedef {import("../../../src/ARSessionManager.js").ARSFaceTrackingConfiguration} ARSFaceTrackingConfiguration */

/** @type {ARSFaceTrackingConfiguration} */
var faceTrackingConfiguration = { type: "faceTracking", isWorldTrackingEnabled: true };
/** @type {ARSWorldTrackingConfiguration} */
var worldTrackingConfiguration = { type: "worldTracking", userFaceTrackingEnabled: true };

function runARSession() {
    const configuration = configurationType == "faceTracking" ? faceTrackingConfiguration : worldTrackingConfiguration;
    ARSessionManager.run(configuration);
}

/** @type {HTMLButtonElement} */
const runButton = document.getElementById("run");
runButton.addEventListener("click", () => {
    runARSession();
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

var enablePlaneDetection = false;
/** @type {HTMLButtonElement} */
const togglePlaneDetectionButton = document.getElementById("togglePlaneDetection");
togglePlaneDetectionButton.addEventListener("click", () => {
    enablePlaneDetection = !enablePlaneDetection;
    console.log("enablePlaneDetection?", enablePlaneDetection);
    worldTrackingConfiguration.planeDetection = enablePlaneDetection ? ["horizontal", "vertical"] : [];
    togglePlaneDetectionButton.innerText = enablePlaneDetection ? "disable plane detection" : "enable plane detection";
    if (ARSessionManager.isRunning && configurationType == "worldTracking") {
        runARSession();
    }
});
togglePlaneDetectionButton.disabled = !ARSessionManager.isSupported;
togglePlaneDetectionButton.click();

/** @typedef {import("../../src/three/three.module.min.js").Vector3} Vector3 */
/** @typedef {import("../../src/three/three.module.min.js").Euler} Euler */
/** @typedef {import("../../src/three/three.module.min.js").Quaternion} Quaternion */
/** @typedef {import("../../src/three/three.module.min.js").PerspectiveCamera} PerspectiveCamera */

const aframeCamera = document.getElementById("camera");
/** @type {PerspectiveCamera} */
var threeCamera;

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

    if (configurationType == "faceTracking") {
        cameraPosition.z *= -1;
        mirrorQuaternionAboutAxes(cameraQuaternion, "x", "y");
    }

    aframeCamera.object3D.position.copy(cameraPosition);
    aframeCamera.object3D.quaternion.copy(cameraQuaternion);

    threeCamera = threeCamera || aframeCamera?.components?.camera?.camera;
    if (threeCamera) {
        if (latestFocalLength != camera.focalLength) {
            threeCamera.setFocalLength(camera.focalLength * 1.13);
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

/** @typedef {import("../../../src/ARSessionManager.js").ARSDebugOptions} ARSDebugOptions */

var isDebugEnabled = false;

/** @type {HTMLButtonElement} */
const toggleDebugButton = document.getElementById("toggleDebug");
toggleDebugButton.addEventListener("click", () => {
    const newIsDebugEnabled = !isDebugEnabled;
    ARSessionManager.setDebugOptions({
        //showWorldOrigin: newIsDebugEnabled,
        showAnchorGeometry: newIsDebugEnabled,
        //showFeaturePoints: newIsDebugEnabled,
    });
});
toggleDebugButton.disabled = !ARSessionManager.isSupported;

ARSessionManager.addEventListener("debugOptions", (event) => {
    /** @type {ARSDebugOptions} */
    const debugOptions = event.message.debugOptions;
    console.log("debugOptions", debugOptions);
    isDebugEnabled = debugOptions.showAnchorGeometry;
    toggleDebugButton.innerText = isDebugEnabled ? "hide debug" : "show debug";
});

/** @typedef {import("../../../src/ARSessionManager.js").ARSLightEstimate} ARSLightEstimate */

const ambientLight = document.getElementById("ambientLight");
const directionalLight = document.getElementById("directionalLight");
/** @type {Vector3} */
const primaryLightDirection = new THREE.Vector3();

ARSessionManager.addEventListener("lightEstimate", (event) => {
    /** @type {ARSLightEstimate} */
    const lightEstimate = event.message.lightEstimate;
    ambientLight.components.light.light.intensity = lightEstimate.ambientIntensity / 1000;
    const lightColor = utils.colorTemperatureToRGB(lightEstimate.ambientColorTemperature);
    ambientLight.components.light.light.color.setRGB(...lightColor);
    directionalLight.components.light.light.color.setRGB(...lightColor);
    if (lightEstimate.primaryLightDirection) {
        directionalLight.components.light.light.intensity = lightEstimate.primaryLightIntensity / 1000;
        primaryLightDirection.set(...lightEstimate.primaryLightDirection.map((v) => -v));
        directionalLight.object3D.position.copy(primaryLightDirection);
    }
});

/** @type {Euler} */
const rotateYaw180DegreesEuler = new THREE.Euler();
rotateYaw180DegreesEuler.y = Math.PI;
/** @type {Quaternion} */
const rotate180DegreesQuaternion = new THREE.Quaternion();
rotate180DegreesQuaternion.setFromEuler(rotateYaw180DegreesEuler);

/** @type {Euler} */
const mirrorEuler = new THREE.Euler(0, 0, 0, "YZX");
/**
 * @param {Quaternion} quaternion
 * @param  {...string} axes
 */
const mirrorQuaternionAboutAxes = (quaternion, ...axes) => {
    mirrorEuler.setFromQuaternion(quaternion);
    axes.forEach((axis) => {
        mirrorEuler[axis] *= -1;
    });
    quaternion.setFromEuler(mirrorEuler);
};

/** @typedef {import("../../../src/ARSessionManager.js").ARSPlaneAnchor} ARSPlaneAnchor */
const planeEntities = {};
const planeContainerEntities = {};
/** @type {Euler} */
const _planeEuler = new THREE.Euler(0, 0, 0, "YXZ");
/** @type {Vector3} */
const _planePosition = new THREE.Vector3();
/** @type {Vector3} */
const _planeCenter = new THREE.Vector3();
/** @type {Quaternion} */
const _planeQuaternion = new THREE.Quaternion();
ARSessionManager.addEventListener("planeAnchors", (event) => {
    /** @type {ARSPlaneAnchor[]} */
    const planeAnchors = event.message.planeAnchors;
    //console.log("plane anchors", planeAnchors);
    const planeEntitiesToRemove = new Set();
    Object.entries(planeContainerEntities).forEach(([identifier, entity]) => {
        if (entity.object3D.visible) {
            planeEntitiesToRemove.add(identifier);
        }
    });
    planeAnchors.forEach((planeAnchor) => {
        _planePosition.set(...planeAnchor.position);
        _planeCenter.set(...planeAnchor.center);
        _planePosition.add(_planeCenter);
        _planeQuaternion.set(...planeAnchor.quaternion);
        _planeEuler.setFromQuaternion(_planeQuaternion);
        _planeEuler.y += planeAnchor.planeExtent.rotationOnYAxis;

        planeEntitiesToRemove.delete(planeAnchor.identifier);
        if (!planeEntities[planeAnchor.identifier]) {
            console.log("creating plane...", planeAnchor.classification || planeAnchor.identifier);

            const planeContainerEntity = document.createElement("a-entity");

            const planeEntity = document.createElement("a-plane");
            planeEntity.setAttribute("opacity", 0.4);
            planeEntity.setAttribute("color", randomColor());

            const classificationTextEntity = document.createElement("a-text");
            classificationTextEntity.setAttribute("value", planeAnchor.classification);
            classificationTextEntity.setAttribute("align", "center");
            planeEntity.appendChild(classificationTextEntity);
            planeEntity._classificationTextEntity = classificationTextEntity;

            planeContainerEntity.dataset.identifier = planeAnchor.identifier;
            planeContainerEntity.dataset.classification = planeAnchor.classification;
            planeContainerEntity.setAttribute("position", _planePosition.toArray().join(" "));
            planeEntity.setAttribute("scale", `${planeAnchor.planeExtent.width} ${planeAnchor.planeExtent.height} 1`);
            planeEntity.setAttribute("rotation", "-90 0 0");

            planeEntities[planeAnchor.identifier] = planeEntity;
            planeContainerEntities[planeAnchor.identifier] = planeContainerEntity;

            planeContainerEntity.appendChild(planeEntity);
            scene.appendChild(planeContainerEntity);
        }
        const planeEntity = planeEntities[planeAnchor.identifier];
        const planeContainerEntity = planeContainerEntities[planeAnchor.identifier];

        if (!planeContainerEntity.object3D.visible) {
            console.log("reshowing plane", planeAnchor.identifier);
            planeContainerEntity.object3D.visible = true;
        }

        if (planeEntity.object3D && planeContainerEntity.object3D) {
            planeContainerEntity.object3D.position.copy(_planePosition);
            planeContainerEntity.object3D.rotation.copy(_planeEuler);
            planeEntity.object3D.scale.x = planeAnchor.planeExtent.width;
            planeEntity.object3D.scale.y = planeAnchor.planeExtent.height;

            if (planeContainerEntity.dataset.classification != planeAnchor.classification) {
                planeContainerEntity.dataset.classification = planeAnchor.classification;
                console.log("updating planeEntity classification", planeContainerEntity.dataset.classification);
                classificationTextEntity = planeEntity._classificationTextEntity;
                classificationTextEntity.setAttribute("value", planeAnchor.classification);
            }
        }
    });
    planeEntitiesToRemove.forEach((identifier) => {
        console.log("hiding plane...", identifier);
        const planeContainerEntity = planeContainerEntities[identifier];
        if (planeContainerEntity) {
            planeContainerEntity.object3D.visible = false;
        }
    });
});

function randomColorComponent() {
    return Math.floor(Math.random() * 255)
        .toString(16)
        .padStart(2, "0");
}
function randomColor() {
    const colors = new Array(3).fill(null).map((_) => randomColorComponent());
    return `#${colors.join("")}`;
}

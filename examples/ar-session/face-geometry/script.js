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
    ARSessionManager.setMessageConfiguration({ faceAnchorGeometry: true });
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

/** @type {ARSConfiguration} */
var configuration = { type: "faceTracking" };

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

/** @typedef {import("../../../src/ARSessionManager.js").ARSFaceAnchor} ARSFaceAnchor */

const facePositionEntity = document.getElementById("facePosition");
const faceRotationEntity = document.getElementById("faceRotation");

/** @typedef {import("../../src/three/three.module.min.js").Vector3} Vector3 */
/** @typedef {import("../../src/three/three.module.min.js").Quaternion} Quaternion */
/** @typedef {import("../../src/three/three.module.min.js").Euler} Euler */
/** @typedef {import("../../src/three/three.module.min.js").Matrix4} Matrix4 */
/** @typedef {import("../../src/three/three.module.min.js").BufferGeometry} BufferGeometry */
/** @typedef {import("../../src/three/three.module.min.js").MeshBasicMaterial} MeshBasicMaterial */
/** @typedef {import("../../src/three/three.module.min.js").Mesh} Mesh */
/** @typedef {import("../../src/three/three.module.min.js").BufferAttribute} BufferAttribute */

const faceSpheres = [];
const faceSpheresEntity = document.getElementById("faceSpheres");
window.faceSpheres = faceSpheres;

/** @type {BufferGeometry} */
const geometry = new THREE.BufferGeometry();
/** @type {Float32Array?} */
var vertices;
/** @type {number[]} */
var triangleIndices;

const material = new THREE.MeshStandardMaterial({
    color: 0x00ff00,
});
/** @type {Mesh} */
var mesh;
const geometryEntity = document.getElementById("geometry");

/** @typedef {"no mode"|"spheres mode" | "mesh mode"} FaceMode */
/** @type {FaceMode} */
var faceMode;
/** @param {FaceMode} newFaceMode  */
const setFaceMode = (newFaceMode) => {
    if (faceMode == newFaceMode) {
        return;
    }
    faceMode = newFaceMode;
    console.log("new faceMode", faceMode);
    switch (faceMode) {
        case "no mode":
            geometryEntity.object3D.visible = false;
            faceSpheresEntity.object3D.visible = false;
            break;
        case "mesh mode":
            geometryEntity.object3D.visible = true;
            faceSpheresEntity.object3D.visible = false;
            break;
        case "spheres mode":
            geometryEntity.object3D.visible = false;
            faceSpheresEntity.object3D.visible = true;
            break;
    }
};
setFaceMode("mesh mode");

const sphereModeButton = document.getElementById("sphereMode");
sphereModeButton.addEventListener("click", () => {
    setFaceMode("spheres mode");
});
const meshModeButton = document.getElementById("meshMode");
meshModeButton.addEventListener("click", () => {
    setFaceMode("mesh mode");
});
const noModeButton = document.getElementById("noMode");
noModeButton.addEventListener("click", () => {
    setFaceMode("no mode");
});

ARSessionManager.addEventListener("faceAnchors", (event) => {
    /** @type {ARSFaceAnchor[]} */
    const faceAnchors = event.message.faceAnchors;
    const faceAnchor = faceAnchors[0];
    if (faceAnchor) {
        /** @type {Vector3} */
        const newPosition = new THREE.Vector3(...faceAnchor.position);
        /** @type {Quaternion} */
        const newQuaternion = new THREE.Quaternion(...faceAnchor.quaternion);

        facePositionEntity.object3D.position.lerp(newPosition, 0.5);
        faceRotationEntity.object3D.quaternion.slerp(newQuaternion, 0.5);

        if (faceAnchor.geometry?.triangleIndices) {
            console.log("vertices", faceAnchor.geometry.vertices);
            vertices = new Float32Array(faceAnchor.geometry.vertices.flat());
            triangleIndices = faceAnchor.geometry.triangleIndices;
            geometry.setIndex(triangleIndices);
            console.log("set index", triangleIndices);
            const bufferAttribute = new THREE.BufferAttribute(vertices, 3);
            console.log("buffer attribute", bufferAttribute);
            geometry.setAttribute("position", bufferAttribute);
            console.log("added vertices to geometry", vertices);
            geometry.computeVertexNormals();
            mesh = new THREE.Mesh(geometry, material);
            console.log("created mesh", mesh);
            geometryEntity.object3D.add(mesh);

            window.triangleIndices = faceAnchor.geometry.triangleIndices;
            window.textureCoordinates = faceAnchor.geometry.textureCoordinates;
        } else {
            if (faceMode == "mesh mode") {
                if (vertices) {
                    /** @type {BufferAttribute} */
                    const positionAttribute = geometry.getAttribute("position");
                    faceAnchor.geometry?.vertices.forEach((vertex, index) => {
                        positionAttribute.setXYZ(index, ...vertex);
                    });
                    positionAttribute.needsUpdate = true;
                }
            }
        }

        if (faceMode == "spheres mode") {
            faceAnchor.geometry?.vertices.forEach((vertex, index) => {
                if (!faceSpheres[index]) {
                    const faceSphere = document.createElement("a-sphere");
                    faceSphere.setAttribute("color", "green");
                    faceSphere.setAttribute("radius", "0.001");
                    faceSphere.setAttribute("position", vertex.join(" "));
                    faceSpheresEntity.appendChild(faceSphere);
                    faceSpheres[index] = faceSphere;
                }
                const faceSphere = faceSpheres[index];
                faceSphere.object3D?.position.set(...vertex);
            });
        }
    }
});

const aframeCamera = document.getElementById("camera");
var latestFocalLength;
ARSessionManager.addEventListener("camera", (event) => {
    /** @type {import("../../../src/ARSessionManager.js").ARSCamera} */
    const camera = event.message.camera;

    //aframeCamera.object3D.position.set(...camera.position);

    if (ARSessionManager.cameraMode == "ar") {
        aframeCamera.object3D.quaternion.set(...camera.quaternion);
    } else {
        /** @type {Euler} */
        const euler = new THREE.Euler(...camera.eulerAngles);
        euler.z += Math.PI / 2;
        aframeCamera.object3D.rotation.copy(euler);
    }

    const threeCamera = aframeCamera?.components?.camera?.camera;
    if (threeCamera) {
        if (latestFocalLength != camera.focalLength) {
            threeCamera.setFocalLength(camera.focalLength * 1.13);
            latestFocalLength = camera.focalLength;
        }
    }

    scene.renderer.toneMappingExposure = camera.exposureOffset;
});

/** @typedef {import("../../../src/ARSessionManager.js").ARSLightEstimate} ARSLightEstimate */

const ambientLight = document.getElementById("ambientLight");
const directionalLight = document.getElementById("directionalLight");

ARSessionManager.addEventListener("lightEstimate", (event) => {
    /** @type {ARSLightEstimate} */
    const lightEstimate = event.message.lightEstimate;
    ambientLight.components.light.light.intensity = lightEstimate.ambientIntensity / 1000;
    const lightColor = utils.colorTemperatureToRGB(lightEstimate.ambientColorTemperature);
    ambientLight.components.light.light.color.setRGB(...lightColor);
    directionalLight.components.light.light.color.setRGB(...lightColor);
    if (lightEstimate.primaryLightDirection) {
        directionalLight.components.light.light.intensity = lightEstimate.primaryLightIntensity / 1000;
        directionalLight.object3D.position.set(...lightEstimate.primaryLightDirection.map((v) => -v));
    }
});

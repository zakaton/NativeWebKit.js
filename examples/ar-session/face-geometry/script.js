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
/** @typedef {import("../../src/three/three.module.min.js").MeshStandardMaterial} MeshStandardMaterial */
/** @typedef {import("../../src/three/three.module.min.js").Texture} Texture */

const faceSpheres = [];
const faceSpheresEntity = document.getElementById("faceSpheres");
window.faceSpheres = faceSpheres;

/** @type {BufferGeometry} */
const geometry = new THREE.BufferGeometry();
/** @type {Float32Array?} */
var verticesFlatArray;
/** @type {Float32Array?} */
var textureCoordinatesFlatArray;
/** @type {number[][]} */
var textureCoordinates;
/** @type {number[]} */
var triangleIndices;

/** @type {Texture} */
const imageUrl =
    location.host == "zakaton.github.io" ? "/NativeWebKit.js/assets/images/image.jpg" : "/assets/images/image.jpg";
const imageTexture = new THREE.TextureLoader().load(imageUrl);
imageTexture.encoding = THREE.sRGBEncoding;
imageTexture.flipY = false;
console.log("imageTexture", imageTexture);

/** @type {MeshStandardMaterial} */
const material = new THREE.MeshStandardMaterial({
    color: "green",
    transparent: true,
});
window.material = material;
/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
context.fillStyle = "white";
//context.fillRect(0, 0, canvas.width, canvas.height);
context.lineWidth = 10;
const canvasTexture = new THREE.CanvasTexture(canvas);
canvasTexture.encoding = THREE.sRGBEncoding;
canvasTexture.flipY = false;
const clearCanvasButton = document.getElementById("clearCanvas");
clearCanvasButton.addEventListener("click", () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    canvasTexture.needsUpdate = true;
});
console.log("canvas", canvas);
console.log("canvasTexture", canvasTexture);
function getCanvasTouchPosition(event) {
    const rect = canvas.getBoundingClientRect();
    const { clientX, clientY } = event.touches[0];
    var x = (clientX - rect.left) / rect.width;
    var y = (clientY - rect.top) / rect.height;
    x = THREE.MathUtils.clamp(x, 0, 1);
    y = THREE.MathUtils.clamp(y, 0, 1);
    x *= canvas.width;
    y *= canvas.height;
    return { x, y };
}
canvas.addEventListener("touchstart", (event) => {
    const { x, y } = getCanvasTouchPosition(event);
    context.beginPath();
    context.moveTo(x, y);
    canvasTexture.needsUpdate = true;
});
canvas.addEventListener("touchmove", (event) => {
    const { x, y } = getCanvasTouchPosition(event);
    context.lineTo(x, y);
    context.stroke();
    canvasTexture.needsUpdate = true;
});

/** @type {HTMLCanvasElement} */
const faceMeshCanvas = document.getElementById("faceMeshCanvas");
const faceMeshContext = faceMeshCanvas.getContext("2d");
function drawFaceMeshCanvas() {
    console.log("drawFaceMeshCanvas", triangleIndices, textureCoordinates);
    faceMeshContext.clearRect(0, 0, faceMeshCanvas.width, faceMeshCanvas.height);
    triangleIndices.forEach((vertexIndex, index) => {
        const triangleIndex = index % 3;
        const textureCoordinate = textureCoordinates[vertexIndex];

        const x = textureCoordinate[0] * faceMeshCanvas.width;
        const y = textureCoordinate[1] * faceMeshCanvas.height;

        if (triangleIndex == 0) {
            faceMeshContext.beginPath();
            faceMeshContext.moveTo(x, y);
        } else {
            faceMeshContext.lineTo(x, y);
            faceMeshContext.stroke();
        }
    });
}

/** @type {Texture} */
var userImageTexture;
/** @type {HTMLInputElement} */
const imageInput = document.getElementById("imageInput");
imageInput.addEventListener("input", async (event) => {
    const imageFile = imageInput.files[0];
    if (!imageFile) {
        console.log("no imageFile");
        return;
    }
    console.log("imageFile", imageFile);
    const imageUrl = URL.createObjectURL(imageFile);
    console.log("image url", imageUrl);
    userImageTexture = new THREE.TextureLoader().load(imageUrl);
    userImageTexture.encoding = THREE.sRGBEncoding;
    userImageTexture.flipY = false;
    console.log("userImageTexture", userImageTexture);
    if (faceMode == "userImage") {
        material.map = userImageTexture;
        material.needsUpdate = true;
    }
});
const clearImageButton = document.getElementById("clearImage");
clearImageButton.addEventListener("click", () => {
    imageInput.value = "";
    console.log("clear image");
    if (faceMode == "userImage") {
        console.log("removing map");
        material.map = null;
        material.needsUpdate = true;
    }
});

/** @type {Mesh} */
var mesh;
const geometryEntity = document.getElementById("geometry");

/** @typedef {"none" | "spheres" | "mesh" | "image" | "wireframe" | "canvas" | "userImage"} FaceMode */
/** @type {FaceMode} */
var faceMode;
/** @param {FaceMode} newFaceMode  */
const setFaceMode = (newFaceMode) => {
    if (faceMode == newFaceMode) {
        return;
    }
    faceMode = newFaceMode;
    console.log("new faceMode", faceMode);
    var showGeometry = false;
    var showFaceSpheres = false;
    var showCanvas = false;
    var materialColor;
    var materialMap;
    var showWireframe = false;
    var showCanvas;

    switch (faceMode) {
        case "none":
            break;
        case "mesh":
            showGeometry = true;
            materialColor = "green";
            break;
        case "image":
            showGeometry = true;
            materialColor = "white";
            materialMap = imageTexture;
            break;
        case "wireframe":
            showWireframe = true;
            showGeometry = true;
            materialColor = "green";
            break;
        case "canvas":
            showGeometry = true;
            showCanvas = true;
            materialColor = "white";
            materialMap = canvasTexture;
            break;
        case "userImage":
            showGeometry = true;
            materialColor = "white";
            materialMap = userImageTexture;
            break;
        case "spheres":
            showFaceSpheres = true;
            break;
    }
    geometryEntity.object3D.visible = showGeometry;
    faceSpheresEntity.object3D.visible = showFaceSpheres;
    if (showCanvas) {
        canvas.parentElement.style.display = "";
    } else {
        canvas.parentElement.style.display = "none";
    }
    if (materialColor) {
        material.color.setColorName(materialColor);
    } else {
        material.color.setColorName("transparent");
    }
    material.map = materialMap;
    material.wireframe = showWireframe;
    material.needsUpdate = true;
};

/** @type {HTMLSelectElement} */
const modeSelect = document.getElementById("mode");
modeSelect.addEventListener("input", () => {
    setFaceMode(modeSelect.value);
});
scene.addEventListener("loaded", () => {
    setFaceMode(modeSelect.value);
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
            verticesFlatArray = new Float32Array(faceAnchor.geometry.vertices.flat());
            textureCoordinates = faceAnchor.geometry.textureCoordinates;
            textureCoordinatesFlatArray = new Float32Array(textureCoordinates.flat());
            triangleIndices = faceAnchor.geometry.triangleIndices;
            geometry.setIndex(triangleIndices);
            console.log("set index", triangleIndices);
            const positionBufferAttribute = new THREE.BufferAttribute(verticesFlatArray, 3);
            const uvBufferAttribute = new THREE.BufferAttribute(textureCoordinatesFlatArray, 2);
            console.log("position buffer attribute", positionBufferAttribute);
            geometry.setAttribute("position", positionBufferAttribute);
            geometry.setAttribute("uv", uvBufferAttribute);
            console.log("added vertices to geometry", verticesFlatArray);
            geometry.computeVertexNormals();
            mesh = new THREE.Mesh(geometry, material);
            console.log("created mesh", mesh);
            geometryEntity.object3D.add(mesh);

            drawFaceMeshCanvas();
        } else {
            if (["mesh", "image", "wireframe", "canvas", "userImage"].includes(faceMode)) {
                if (verticesFlatArray) {
                    /** @type {BufferAttribute} */
                    const positionAttribute = geometry.getAttribute("position");
                    faceAnchor.geometry?.vertices.forEach((vertex, index) => {
                        positionAttribute.setXYZ(index, ...vertex);
                    });
                    //geometry.computeVertexNormals();
                    positionAttribute.needsUpdate = true;
                }
            }
        }

        if (faceMode == "spheres") {
            const numberOfVertices = faceAnchor.geometry?.vertices?.length;
            faceAnchor.geometry?.vertices.forEach((vertex, index) => {
                if (!faceSpheres[index]) {
                    const interpolation = index / (numberOfVertices - 1);
                    var positive = Math.floor(interpolation * 255).toString(16);
                    var negative = Math.floor((1 - interpolation) * 255).toString(16);
                    if (positive.length == 1) {
                        positive = `0${positive}`;
                    }
                    if (negative.length == 1) {
                        negative = `0${negative}`;
                    }
                    const faceSphere = document.createElement("a-sphere");
                    const color = `#ff${negative}${negative}`;
                    faceSphere.setAttribute("color", color);
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

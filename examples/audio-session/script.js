import { AudioSessionManager } from "../../src/NativeWebKit.js";
console.log(AudioSessionManager);
window.AudioSessionManager = AudioSessionManager;

AudioSessionManager.sendTestMessage();

/** @type {HTMLButtonElement} */
const allowMicrophoneAccessButton = document.getElementById("allowMicrophoneAccess");
allowMicrophoneAccessButton.disabled = !Boolean(navigator.mediaDevices);
allowMicrophoneAccessButton.addEventListener("click", async () => {
    await getMicrophone();
    stopMicrophone();
});

/** @type {HTMLSelectElement} */
const microphonesSelect = document.getElementById("microphones");
const microphonesSelectOptgroup = microphonesSelect.querySelector("optgroup");
microphonesSelect.addEventListener("input", () => {
    console.log("selected microphone", microphonesSelect.value);
    if (microphonesSelect.value.length > 0) {
        selectedMicrophoneDeviceId = microphonesSelect.value;
        if (audioStream) {
            getMicrophone();
        }
    } else {
        selectedMicrophoneDeviceId = null;
        stopMicrophone();
    }
});

/** @type {HTMLDivElement} */
const microphoneControlsContainer = document.getElementById("microphoneControls");

const populateMicrophonesSelect = async () => {
    const devices = await navigator.mediaDevices?.enumerateDevices();
    console.log("devices", devices);
    const areDevicesValid = !devices.some((device) => device.deviceId == "");
    console.log("are devices valid?", areDevicesValid);
    if (areDevicesValid) {
        microphoneControlsContainer.hidden = false;
        allowMicrophoneAccessButton.hidden = true;
        const microphones = devices.filter((device) => device.kind == "audioinput" && device.deviceId.length > 0);
        console.log("microphones", microphones);
        microphonesSelectOptgroup.innerHTML = "";
        microphones.forEach((microphone) => {
            microphonesSelectOptgroup.appendChild(new Option(microphone.label, microphone.deviceId));
        });
    }
};
navigator.mediaDevices?.addEventListener("devicechange", () => populateMicrophonesSelect());
populateMicrophonesSelect();

/** @type {string|null} */
var selectedMicrophoneDeviceId = null;
/** @type {MediaStream|null} */
var audioStream = null;
const stopMicrophone = () => {
    if (audioStream) {
        console.log("stopping microphone...");
        audioStream.getAudioTracks().forEach((track) => track.stop());
        audioStream = null;
        console.log("stopped microphone");
        audio.srcObject = null;
    }
};
const getMicrophone = async () => {
    stopMicrophone();

    console.log("getting audioStream with deviceId", selectedMicrophoneDeviceId);
    audioStream = await navigator.mediaDevices?.getUserMedia({
        audio: selectedMicrophoneDeviceId ? { deviceId: selectedMicrophoneDeviceId } : true,
    });
    audio.srcObject = audioStream;
    console.log("got audioStream", audioStream);
};

const audio = new Audio();
audio.muted = true;
audio.autoplay = true;
window.audio = audio;
/** @type {HTMLButtonElement} */
const listenToMicrophoneButton = document.getElementById("listenToMicrophone");
listenToMicrophoneButton.addEventListener("click", () => {
    audio.muted = !audio.muted;
    listenToMicrophoneButton.innerText = audio.muted ? "listen to microphone" : "stop listening to microphone";
});

/** @type {HTMLButtonElement} */
const toggleMicrophoneButton = document.getElementById("toggleMicrophone");
toggleMicrophoneButton.addEventListener("click", async () => {
    if (audioStream) {
        stopMicrophone();
    } else {
        await getMicrophone();
    }
    toggleMicrophoneButton.innerText = audioStream ? "disable microphone" : "enable microphone";
});

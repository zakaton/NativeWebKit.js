import { CoreBluetoothManager } from "../../../src/NativeWebKit.js";
import { sortObjectKeysAlphabetically } from "../../../src/utils/objectUtils.js";
//import { CoreBluetoothManager } from "../../../build/nativewebkit.module.js";
window.CoreBluetoothManager = CoreBluetoothManager;
console.log(CoreBluetoothManager);
CoreBluetoothManager.checkStateOnLoad = true;

/** @type {HTMLInputElement} */
const stateInput = document.getElementById("state");
CoreBluetoothManager.addEventListener("state", (event) => {
    console.log("state", event.message.state);
    stateInput.value = CoreBluetoothManager.state;
});

/** @type {HTMLInputElement} */
const isAvailableCheckbox = document.getElementById("isAvailable");
CoreBluetoothManager.addEventListener("isAvailable", (event) => {
    const isAvailable = event.message.isAvailable;
    console.log("isAvailable", isAvailable);
    isAvailableCheckbox.checked = isAvailable;
});

/** @type {HTMLButtonElement} */
const startScanButton = document.getElementById("startScan");
/** @type {HTMLButtonElement} */
const stopScanButton = document.getElementById("stopScan");

CoreBluetoothManager.addEventListener("isScanning", (event) => {
    const isScanning = event.message.isScanning;
    console.log("isScanning", isScanning);
    startScanButton.disabled = isScanning;
    stopScanButton.disabled = !isScanning;
});

/** @type {HTMLTextAreaElement} */
const serviceUUIDsTextarea = document.getElementById("serviceUUIDs");
/** @type {HTMLInputElement} */
const allowDuplicatesCheckbox = document.getElementById("allowDuplicates");
/** @type {HTMLTextAreaElement} */
const solicitedServiceUUIDsTextarea = document.getElementById("solicitedServiceUUIDs");

startScanButton.addEventListener("click", () => {
    /** @type {import("../../../src/CoreBluetoothManager.js").CBScanOptions} */
    const scanOptions = { options: {} };

    const serviceUUIDs = serviceUUIDsTextarea.value
        .replace("\n", ",")
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value.length > 0);

    if (serviceUUIDs.length > 0) {
        scanOptions.serviceUUIDs = serviceUUIDs;
    }

    scanOptions.options.allowDuplicates = allowDuplicatesCheckbox.checked;

    const solicitedServiceUUIDs = solicitedServiceUUIDsTextarea.value
        .replace("\n", ",")
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
    if (solicitedServiceUUIDs.length > 0) {
        scanOptions.options.solicitedServiceUUIDs = solicitedServiceUUIDs;
    }

    CoreBluetoothManager.startScan(scanOptions);
});

stopScanButton.addEventListener("click", () => {
    CoreBluetoothManager.stopScan();
});

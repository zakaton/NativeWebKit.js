import { CoreBluetoothManager } from "../../../src/NativeWebKit.js";
import { sortObjectKeysAlphabetically } from "../../../src/utils/objectUtils.js";
//import { CoreBluetoothManager } from "../../../build/nativewebkit.module.js";
window.CoreBluetoothManager = CoreBluetoothManager;
console.log(CoreBluetoothManager);
CoreBluetoothManager.checkStateOnLoad = true;
CoreBluetoothManager.stopScanOnUnload = true;

/** @type {HTMLInputElement} */
const stateInput = document.getElementById("state");
CoreBluetoothManager.addEventListener("state", (event) => {
    /** @type {import("../../../src/CoreBluetoothCentralManager.js").CBState} */
    const state = event.message.state;
    console.log({ state });
    stateInput.value = CoreBluetoothManager.state;
});

/** @type {HTMLInputElement} */
const isAvailableCheckbox = document.getElementById("isAvailable");
CoreBluetoothManager.addEventListener("isAvailable", (event) => {
    const isAvailable = event.message.isAvailable;
    console.log({ isAvailable });
    isAvailableCheckbox.checked = isAvailable;
});

/** @type {HTMLButtonElement} */
const startScanButton = document.getElementById("startScan");
/** @type {HTMLButtonElement} */
const stopScanButton = document.getElementById("stopScan");

CoreBluetoothManager.addEventListener("isScanning", (event) => {
    const isScanning = event.message.isScanning;
    console.log({ isScanning });
    if (isScanning) {
        discoveredDeviceContainers = {};
        discoveredDevicesContainer.innerHTML = "";
    }
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
    /** @type {import("../../../src/CoreBluetoothCentralManager.js").CBScanOptions} */
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

/** @type {HTMLElement} */
const discoveredDevicesContainer = document.getElementById("discoveredDevices");
/** @type {HTMLTemplateElement} */
const discoveredDeviceTemplate = document.getElementById("discoveredDeviceTemplate");
/** @type {object.<string, HTMLElement>} */
var discoveredDeviceContainers = {};

CoreBluetoothManager.addEventListener("discoveredDevice", (event) => {
    /** @type {import("../../../src/CoreBluetoothCentralManager.js").CBDiscoveredPeripheral} */
    const discoveredDevice = event.message.discoveredDevice;
    console.log({ discoveredDevice });

    /** @type {HTMLElement} */
    var discoveredDeviceContainer = discoveredDeviceContainers[discoveredDevice.identifier];
    if (!discoveredDeviceContainer) {
        discoveredDeviceContainer = discoveredDeviceTemplate.content.cloneNode(true).querySelector(".discoveredDevice");
        discoveredDeviceContainer.querySelector(".identifier").innerText = discoveredDevice.identifier;
        discoveredDeviceContainers[discoveredDevice.identifier] = discoveredDeviceContainer;
        console.log("creating new container for device", { discoveredDevice, discoveredDeviceContainer });
        discoveredDevicesContainer.appendChild(discoveredDeviceContainer);
    }

    discoveredDeviceContainer.querySelector(".name").innerText = discoveredDevice.name;
    const nameSpan = discoveredDeviceContainer.querySelector(".name");
    const nameSpanParent = nameSpan.closest("li");
    if (discoveredDevice.name) {
        nameSpanParent.removeAttribute("hidden");
    } else {
        nameSpanParent.setAttribute("hidden", "");
    }
    discoveredDeviceContainer.querySelector(".rssi").innerText = discoveredDevice.rssi;
    discoveredDeviceContainer.querySelector(".advertisementData").innerText = JSON.stringify(
        sortObjectKeysAlphabetically(discoveredDevice.advertisementData)
    );
});

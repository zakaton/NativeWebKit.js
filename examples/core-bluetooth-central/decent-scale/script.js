import { CBCentralManager } from "../../../src/NativeWebKit.js";
//import { CBCentralManager } from "../../../build/nativewebkit.module.js";
window.CBCentralManager = CBCentralManager;
console.log(CBCentralManager);
CBCentralManager.checkStateOnLoad = true;
CBCentralManager.checkConnectedPeripheralsOnLoad = true;
CBCentralManager.stopScanOnUnload = true;
CBCentralManager.disconnectOnUnload = true;

import DecentScale from "./DecentScale.js";

const decentScale = new DecentScale();

/** @type {HTMLInputElement} */
const stateInput = document.getElementById("state");
CBCentralManager.addEventListener("state", (event) => {
    /** @type {import("../../../src/CBCentralManager.js").CBCentralState} */
    const state = event.message.state;
    console.log({ state });
    stateInput.value = CBCentralManager.state;
});

/** @type {HTMLInputElement} */
const isAvailableCheckbox = document.getElementById("isAvailable");
CBCentralManager.addEventListener("isAvailable", (event) => {
    const isAvailable = event.message.isAvailable;
    console.log({ isAvailable });
    isAvailableCheckbox.checked = isAvailable;
});

/** @type {HTMLButtonElement} */
const startScanButton = document.getElementById("startScan");
/** @type {HTMLButtonElement} */
const stopScanButton = document.getElementById("stopScan");
/** @type {HTMLButtonElement} */
const disconnectButton = document.getElementById("disconnect");

CBCentralManager.addEventListener("isScanning", (event) => {
    const isScanning = event.message.isScanning;
    startScanButton.disabled = peripheral || isScanning;
    stopScanButton.disabled = peripheral || !isScanning;
});

const serviceUUID = decentScale.services.main.uuid;
startScanButton.addEventListener("click", () => {
    CBCentralManager.startScan({ serviceUUIDs: [serviceUUID] });
});
stopScanButton.addEventListener("click", () => {
    CBCentralManager.stopScan();
});
disconnectButton.addEventListener("click", () => {
    CBCentralManager.disconnect(peripheral.identifier);
});

/** @typedef {import("../../../src/CBCentralManager.js").CBDiscoveredPeripheral} CBDiscoveredPeripheral */
/** @typedef {import("../../../src/CBCentralManager.js").CBPeripheral} CBPeripheral */
/** @typedef {import("../../../src/CBCentralManager.js").CBService} CBService */
/** @typedef {import("../../../src/CBCentralManager.js").CBCharacteristic} CBCharacteristic */

CBCentralManager.addEventListener("discoveredPeripheral", (event) => {
    /** @type {CBDiscoveredPeripheral} */
    const discoveredPeripheral = event.message.discoveredPeripheral;
    CBCentralManager.connect({ identifier: discoveredPeripheral.identifier, options: { enableAutoReconnect: true } });
    CBCentralManager.stopScan();
});

/** @type {CBPeripheral?} */
var peripheral;
CBCentralManager.addEventListener("peripheralConnectionState", (event) => {
    /** @type {CBPeripheral} */
    const _peripheral = event.message.peripheral;

    switch (_peripheral.connectionState) {
        case "connected":
            console.log("connected");
            startScanButton.disabled = true;
            stopScanButton.disabled = true;
            disconnectButton.disabled = false;
            tareButton.disabled = false;
            peripheral = _peripheral;
            CBCentralManager.discoverServices(peripheral.identifier, [serviceUUID]);
            break;
        case "disconnected":
            console.log("disconnected");
            startScanButton.disabled = CBCentralManager.isScanning;
            stopScanButton.disabled = !CBCentralManager.isScanning;
            disconnectButton.disabled = true;
            tareButton.disabled = true;
            peripheral = null;
            break;
    }
});

const characteristicUUIDs = [
    decentScale.services.main.characteristics.command.uuid,
    decentScale.services.main.characteristics.data.uuid,
];
CBCentralManager.addEventListener("discoveredService", (event) => {
    /** @type {CBPeripheral} */
    const peripheral = event.message.peripheral;
    /** @type {CBService} */
    const service = event.message.discoveredService;

    console.log("discovered", service);

    CBCentralManager.discoverCharacteristics(peripheral.identifier, service.uuid, characteristicUUIDs);
});

CBCentralManager.addEventListener("discoveredCharacteristic", (event) => {
    /** @type {CBPeripheral} */
    const peripheral = event.message.peripheral;
    /** @type {CBService} */
    const service = event.message.service;
    /** @type {CBPeripheral} */
    const characteristic = event.message.discoveredCharacteristic;

    switch (characteristic.uuid) {
        case decentScale.services.main.characteristics.command.uuid:
            const data = decentScale.formatCommandData([0x0a, Number(true), Number(false), Number(!true), 0]);
            CBCentralManager.writeCharacteristicValue(peripheral.identifier, service.uuid, characteristic.uuid, data);
            break;
        case decentScale.services.main.characteristics.data.uuid:
            CBCentralManager.setCharacteristicNotifyValue(
                peripheral.identifier,
                service.uuid,
                characteristic.uuid,
                true
            );
            break;
    }
});

CBCentralManager.addEventListener("characteristicValue", (event) => {
    /** @type {CBPeripheral} */
    const peripheral = event.message.peripheral;
    /** @type {CBService} */
    const service = event.message.service;
    /** @type {CBCharacteristic} */
    const characteristic = event.message.characteristic;
    /** @type {number[]} */
    const value = characteristic.value;

    decentScale.onDataCharacteristicValueChanged({ target: { value: new DataView(Uint8Array.from(value).buffer) } });
});

/** @type {HTMLButtonElement} */
const tareButton = document.getElementById("tare");
tareButton.addEventListener("click", () => {
    tare();
});

const tare = () => {
    writeCommand([0x0f, 0, 0, 0, 0]);
};

const setLED = (showWeight = false, showTimer = false, showGrams = true) => {
    return writeCommand([0x0a, Number(showWeight), Number(showTimer), Number(!showGrams), 0]);
};

const writeCommand = (command) => {
    const data = decentScale.formatCommandData(command);
    CBCentralManager.writeCharacteristicValue(
        peripheral.identifier,
        serviceUUID,
        decentScale.services.main.characteristics.command.uuid,
        data
    );
};

const weightSpan = document.getElementById("weight");
decentScale.addEventListener("weight", (event) => {
    weightSpan.innerText = `${event.message.weight} grams (${event.message.isStable ? "stable" : "unstable"})`;
});

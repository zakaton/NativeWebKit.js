import EventDispatcher from "./utils/EventDispatcher.js";
import { createConsole } from "./utils/Console.js";
import Timer from "./utils/Timer.js";

import { sendMessageToApp, addAppListener } from "./utils/messaging.js";
import AppMessagePoll from "./utils/AppMessagePoll.js";
import { isInApp } from "./utils.js";

const _console = createConsole("CBCentral", { log: true });

/** @typedef {"state" | "startScan" | "stopScan" | "isScanning" | "discoveredPeripherals" | "discoveredPeripheral" | "connect" | "disconnect" | "disconnectAll" | "peripheralConnectionState" | "connectedPeripherals" | "disconnectedPeripherals" | "getRSSI" | "readRSSI" | "discoverServices" | "getServices" | "getService" | "discoverIncludedServices" | "getIncludedServices" | "discoverCharacteristics" | "getCharacteristics" | "readCharacteristicValue" | "writeCharacteristicValue" | "getCharacteristicValue" | "setCharacteristicNotifyValue" | "getCharacteristicNotifyValue" | "updatedCharacteristicValues" | "discoverDescriptors" | "getDescriptors" | "readDescriptorValue" | "writeDescriptorValue" | "getDescriptorValue" } CBCentralMessageType */

/** @typedef {"state" | "isAvailable" | "isScanning" | "discoveredPeripheral" | "peripheralConnectionState" | "expiredDiscoveredPeripheral" | "peripheralRSSI" | "discoveredService" | "discoveredServices" | "discoveredIncludedService" | "discoveredIncludedServices" | "discoveredCharacteristic" | "discoveredCharacteristics" | "characteristicValue" | "characteristicNotifyValue" | "discoveredDescriptor" | "discoveredDescriptors" | "descriptorValue"} CBCentralEventType */

/** @typedef {import("./utils/EventDispatcher.js").EventDispatcherOptions} EventDispatcherOptions */

/** @typedef {import("./utils/messaging.js").NKMessage} NKMessage */

/**
 * @typedef CBCentralMessage
 * @type {object}
 * @property {CBCentralMessageType} type
 * @property {object} message
 */

/**
 * @typedef CBCentralAppMessage
 * @type {object}
 * @property {CBCentralMessageType} type
 */

/**
 * @typedef CBCentralEvent
 * @type {object}
 * @property {CBCentralEventType} type
 * @property {object} message
 */

/**
 * @typedef {(event: CBCentralEvent) => void} CBCentralEventListener
 */

/** @typedef {"unknown" | "resetting" | "unsupported" | "unauthorized" | "poweredOff" | "poweredOn"} CBCentralState */

/**
 * @typedef CBScanOptions
 * @type {object}
 * @property {string[]} serviceUUIDs
 * @property {object} options
 * @property {bool} options.allowDuplicates
 * @property {string[]} options.solicitedServiceUUIDs
 */

/**
 * @typedef CBDiscoveredPeripheral
 * @type {object}
 * @property {string?} name
 * @property {string} identifier
 * @property {number} rssi
 * @property {object} advertisementData
 * @property {number} advertisementData.timestamp
 * @property {object.<string, number[]>} advertisementData.serviceData
 * @property {number?} lastTimeUpdated
 */

/**
 * @typedef CBConnectOptions
 * @type {object}
 * @property {string} identifier
 * @property {object} options
 * @property {bool} options.enableAutoReconnect
 * @property {bool} options.enableTransportBridging not available on mac
 * @property {bool} options.notifyOnDisconnection
 * @property {bool} options.notifyOnNotification
 * @property {bool} options.requiresANCS not available on mac
 * @property {number} options.startDelay
 */

/** @typedef {"disconnected" | "connecting" | "connected" | "disconnecting" | "unknown"} CBConnectionState */
/**
 * @typedef CBPeripheralConnectionState
 * @type {object}
 * @property {string} identifier
 * @property {CBConnectionState} connectionState
 */

/**
 * @typedef CBPeripheral
 * @type {object}
 * @property {string} identifier
 * @property {string?} name
 * @property {CBConnectionState?} connectionState
 * @property {number?} rssi
 * @property {number?} rssiTimestamp
 * @property {boolean} _pendingRSSI
 * @property {Object.<string, CBService>?} services
 * @property {number?} _getServicesTimestamp
 * @property {string[]?} _pendingServices
 * @property {string[]?} _pendingIncludedServices
 * @property {number?} _characteristicValueTimestamp
 */

/**
 * @typedef CBPeripheralRSSI
 * @type {object}
 * @property {string} identifier
 * @property {number} rssi
 * @property {rssi} timestamp
 */

/**
 * @typedef CBService
 * @type {object}
 * @property {string} uuid
 * @property {Object.<string, CBCharacteristic>} characteristics
 * @property {string[]} includedServiceUUIDs
 * @property {string[]?} _pendingCharacteristics
 */

/**
 * @typedef CBCharacteristic
 * @type {object}
 * @property {string} uuid
 * @property {CBCharacteristicProperties} properties
 * @property {Object.<string, CBDescriptor>} descriptors
 * @property {boolean} isNotifying
 * @property {number[]?} value
 * @property {number?} valueTimestamp
 * @property {string[]} _pendingDescriptors
 * @property {boolean} _pendingValue
 * @property {boolean} _pendingIsNotifying
 */

/**
 * @typedef CBCharacteristicProperties
 * @type {object}
 * @property {boolean} read
 * @property {boolean} write
 * @property {boolean} notify
 * @property {boolean} indicate
 */

/**
 * @typedef CBUpdatedCharacteristicValue
 * @type {object}
 * @property {string} identifier
 * @property {string} serviceUUID
 * @property {string} characteristicUUID
 * @property {number[]} value
 * @property {number} timestamp
 */

/**
 * @typedef CBDescriptor
 * @type {object}
 * @property {string} uuid
 * @property {CBDescriptorValue} value
 */

/**
 * @typedef CBDescriptorValue
 * @type {object}
 * @property {string} type
 * @property {any} value
 */

class CBCentralManager {
    /** @type {CBCentralEventType[]} */
    static #EventsTypes = [
        "state",
        "isAvailable",
        "isScanning",
        "discoveredPeripheral",
        "expiredDiscoveredPeripheral",
        "peripheralConnectionState",
        "peripheralRSSI",
        "discoveredService",
        "discoveredServices",
        "discoveredCharacteristics",
        "discoveredCharacteristic",
        "characteristicNotifyValue",
        "characteristicValue",
    ];
    /** @type {CBCentralEventType[]} */
    get eventTypes() {
        return CBCentralManager.#EventsTypes;
    }
    #eventDispatcher = new EventDispatcher(this.eventTypes);

    /**
     * @param {CBCentralEventType} type
     * @param {CBCentralEventListener} listener
     * @param {EventDispatcherOptions?} options
     */
    addEventListener(type, listener, options) {
        return this.#eventDispatcher.addEventListener(...arguments);
    }
    /**
     * @param {CBCentralEventType} type
     * @param {CBCentralEventListener} listener
     * @returns {boolean}
     */
    removeEventListener(type, listener) {
        return this.#eventDispatcher.removeEventListener(...arguments);
    }
    /**
     * @param {CBCentralEventType} type
     * @param {CBCentralEventListener} listener
     * @returns {boolean}
     */
    hasEventListener(type, listener) {
        return this.#eventDispatcher.hasEventListener(...arguments);
    }
    /** @param {CBCentralEvent} event */
    #dispatchEvent(event) {
        return this.#eventDispatcher.dispatchEvent(event);
    }

    static #shared = new CBCentralManager();
    static get shared() {
        return this.#shared;
    }
    #prefix = "cbc";
    /**
     * @param {CBCentralMessage[]} messages
     * @returns {NKMessage[]}
     */
    #formatMessages(messages) {
        return messages.map((message) => Object.assign({}, message, { type: `${this.#prefix}-${message.type}` }));
    }

    /** @throws {Error} if singleton already exists */
    constructor() {
        _console.assertWithError(!this.shared, "CBCentralManager is a singleton - use CBCentralManager.shared");

        addAppListener(this.#getWindowLoadMessages.bind(this), "window.load");
        addAppListener(this.#onAppMessage.bind(this), this.#prefix);
        addAppListener(this.#getWindowUnloadMessages.bind(this), "window.unload");
    }

    get isSupported() {
        return true;
    }
    /** @throws {Error} if not supported */
    #assertIsSupported() {
        if (!this.isSupported) {
            throw Error("not supported");
        }
    }

    /** @returns {NKMessage[]?} */
    #getWindowLoadMessages() {
        /** @type {CBCentralMessage[]} */
        const messages = [];
        if (this.checkStateOnLoad) {
            messages.push({ type: "state" });
        }
        if (this.checkConnectedPeripheralsOnLoad) {
            messages.push({ type: "connectedPeripherals", serviceUUIDs: [] });
        }
        return this.#formatMessages(messages);
    }
    /** @returns {NKMessage[]?} */
    #getWindowUnloadMessages() {
        /** @type {CBCentralMessage[]} */
        const messages = [];
        if (this.#isScanning && this.#stopScanOnUnload) {
            messages.push({ type: "stopScan" });
        }
        if (this.#disconnectOnUnload && this.#peripherals.length > 0) {
            messages.push({ type: "disconnectAll" });
        }
        return this.#formatMessages(messages);
    }

    /** @param {CBCentralAppMessage} message */
    async #sendMessageToApp(message) {
        message.type = `${this.#prefix}-${message.type}`;
        return sendMessageToApp(message);
    }

    /** @type {boolean} */
    #checkStateOnLoad = false;
    get checkStateOnLoad() {
        return this.#checkStateOnLoad;
    }
    set checkStateOnLoad(newValue) {
        _console.assertTypeWithError(newValue, "boolean");
        this.#checkStateOnLoad = newValue;
    }

    /** @type {boolean} */
    #stopScanOnUnload = true;
    get stopScanOnUnload() {
        return this.#stopScanOnUnload;
    }
    set stopScanOnUnload(newValue) {
        _console.assertTypeWithError(newValue, "boolean");
        this.#stopScanOnUnload = newValue;
    }

    /** @type {boolean} */
    #disconnectOnUnload = true;
    get disconnectOnUnload() {
        return this.#disconnectOnUnload;
    }
    set disconnectOnUnload(newValue) {
        _console.assertTypeWithError(newValue, "boolean");
        this.#disconnectOnUnload = newValue;
    }

    /** @type {CBCentralState?} */
    #state = null;
    get state() {
        return this.#state || "unknown";
    }
    /** @param {CBCentralState} newState */
    #onState(newState) {
        if (this.#state == newState) {
            return;
        }

        this.#state = newState;
        _console.log("updated state", this.state);
        this.#dispatchEvent({ type: "state", message: { state: this.state } });
        this.#dispatchEvent({ type: "isAvailable", message: { isAvailable: this.isAvailable } });

        if (this.state == "poweredOn") {
            this.#checkIsScanning();
        }
        if (this.#state == "unknown") {
            this.#checkStatePoll.start();
        } else {
            this.#checkStatePoll.stop();
        }
    }
    #checkStatePoll = new AppMessagePoll({ type: "state" }, this.#prefix, 500);

    get isAvailable() {
        return this.state == "poweredOn";
    }
    /** @throws {Error} if not supported */
    #assertIsAvailable() {
        this.#assertIsSupported();
        _console.assertWithError(this.isAvailable, "not available");
    }

    /** @type {boolean?} */
    #isScanning = null;
    get isScanning() {
        return Boolean(this.#isScanning);
    }
    /** @param {boolean} newIsScanning */
    #onIsScanning(newIsScanning) {
        if (this.#isScanning == newIsScanning) {
            return;
        }

        this.#isScanning = newIsScanning;
        _console.log(`updated isScanning to ${this.#isScanning}`);
        this.#dispatchEvent({
            type: "isScanning",
            message: { isScanning: this.isScanning },
        });

        this.#isScanningPoll.stop();

        if (this.isScanning) {
            this.#discoveredPeripheralsPoll.start();
            this.#scanTimer.start();
        } else {
            this.#discoveredPeripheralsPoll.stop();
            this.#scanTimer.stop();
        }
    }
    async #checkIsScanning() {
        _console.log("checking isScanning");
        return this.#sendMessageToApp({ type: "isScanning" });
    }
    #isScanningPoll = new AppMessagePoll({ type: "isScanning" }, this.#prefix, 50);

    #checkDiscoveredPeripherals() {
        const now = Date.now();

        Object.entries(this.#discoveredPeripherals).forEach(([identifier, discoveredPeripheral]) => {
            const hasExpired = now - discoveredPeripheral.lastTimeUpdated > 4000;
            if (hasExpired) {
                delete this.#discoveredPeripherals[identifier];
                this.#dispatchEvent({
                    type: "expiredDiscoveredPeripheral",
                    message: { expiredDiscoveredPeripheral: discoveredPeripheral },
                });
            }
        });
    }
    #scanTimer = new Timer(this.#checkDiscoveredPeripherals.bind(this), 1000);

    /** @param {CBScanOptions?} scanOptions */
    async startScan(scanOptions) {
        this.#assertIsAvailable();
        _console.assertWithError(!this.isScanning, "already scanning");
        _console.log("starting scan", scanOptions);
        this.#discoveredPeripherals.length = 0;
        this.#isScanningPoll.start();
        return this.#sendMessageToApp({ type: "startScan", scanOptions });
    }
    async stopScan() {
        this.#assertIsAvailable();
        _console.assertWithError(this.isScanning, "already not scanning");
        _console.log("stopping scan");
        this.#isScanningPoll.start();
        return this.#sendMessageToApp({ type: "stopScan" });
    }

    async toggleScan() {
        this.#assertIsAvailable();
        if (this.isScanning) {
            return this.stopScan();
        } else {
            return this.startScan();
        }
    }

    /** @type {Object.<string, CBDiscoveredPeripheral>} */
    #discoveredPeripherals = {};
    get discoveredPeripherals() {
        return this.#discoveredPeripherals;
    }
    /** @param {string} identifier */
    #assertValidDiscoveredPeripheralIdentifier(identifier) {
        _console.assertWithError(
            identifier in this.#discoveredPeripherals,
            `no discovered peripheral with identifier "${identifier}" found`
        );
    }
    /** @param {CBDiscoveredPeripheral[]} newDiscoveredPeripherals */
    #onDiscoveredPeripherals(newDiscoveredPeripherals) {
        newDiscoveredPeripherals.forEach((discoveredPeripheral) => {
            this.#onDiscoveredPeripheral(discoveredPeripheral);
        });
    }
    /** @param {CBDiscoveredPeripheral} newDiscoveredPeripheral */
    #onDiscoveredPeripheral(newDiscoveredPeripheral) {
        var discoveredPeripheral = this.#discoveredPeripherals[newDiscoveredPeripheral.identifier];
        if (discoveredPeripheral) {
            Object.assign(discoveredPeripheral, newDiscoveredPeripheral);
        } else {
            this.#discoveredPeripherals[newDiscoveredPeripheral.identifier] = newDiscoveredPeripheral;
            discoveredPeripheral = newDiscoveredPeripheral;
        }
        discoveredPeripheral.lastTimeUpdated = Date.now();
        this.#dispatchEvent({ type: "discoveredPeripheral", message: { discoveredPeripheral } });
    }
    #discoveredPeripheralsPoll = new AppMessagePoll({ type: "discoveredPeripherals" }, this.#prefix, 200);

    /** @type {Object.<string, CBPeripheral>} */
    #peripherals = {};
    get peripherals() {
        return this.#peripherals;
    }
    /**
     * @param {string} identifier
     * @returns {CBPeripheral}
     */
    #assertValidPeripheralIdentifier(identifier) {
        const peripheral = this.#peripherals[identifier];
        _console.assertWithError(peripheral, `no peripheral with identifier "${identifier}" found`);
        return peripheral;
    }
    /**
     * @param {string} identifier
     * @returns {CBPeripheral}
     */
    #assertConnectedPeripheralIdentifier(identifier) {
        const peripheral = this.#assertValidPeripheralIdentifier(identifier);
        _console.assertWithError(peripheral.connectionState == "connected", "peripheral is not connected");
        return peripheral;
    }

    /**
     * @param {string} identifier
     * @param {string} serviceUUID
     * @returns {{peripheral: CBPeripheral, service: CBService}}
     */
    #assertValidServiceUUID(identifier, serviceUUID) {
        const peripheral = this.#assertValidPeripheralIdentifier(identifier);
        const service = peripheral.services[serviceUUID];
        _console.assert(service, `serviceUUID ${serviceUUID} not found`);
        return { peripheral, service };
    }

    /**
     * @param {string} identifier
     * @param {string} serviceUUID
     * @param {string} characteristicUUID
     * @returns {{peripheral: CBPeripheral, service: CBService, characteristic: CBCharacteristic}}
     */
    #assertValidCharacteristicUUID(identifier, serviceUUID, characteristicUUID) {
        const { peripheral, service } = this.#assertValidServiceUUID(identifier, serviceUUID);
        console.log({ peripheral, service });
        const characteristic = service.characteristics[characteristicUUID];
        _console.assert(characteristic, `characteristicUUID ${serviceUUID} not found`);
        return { peripheral, service, characteristic };
    }

    /**
     * @param {string} identifier
     * @param {string} serviceUUID
     * @param {string} characteristicUUID
     * @param {string} descriptorUUID
     * @returns {{peripheral: CBPeripheral, service: CBService, characteristic: CBCharacteristic, descriptor: CBDescriptor}}
     */
    #assertValidDescriptorUUID(identifier, serviceUUID, characteristicUUID, descriptorUUID) {
        const { peripheral, service, characteristic } = this.#assertValidCharacteristicUUID(
            identifier,
            serviceUUID,
            characteristicUUID
        );
        const descriptor = characteristic.descriptors[descriptorUUID];
        _console.assert(descriptor, `descriptorUUID ${descriptorUUID} not found`);
        return { peripheral, service, characteristic, descriptor };
    }

    /** @param {CBConnectOptions} connectOptions */
    async connect(connectOptions) {
        this.#assertIsAvailable();
        var peripheral = this.#peripherals[connectOptions.identifier];
        if (!peripheral) {
            const discoveredPeripheral = this.#discoveredPeripherals[connectOptions.identifier];
            this.#assertValidDiscoveredPeripheralIdentifier(connectOptions.identifier);
            peripheral = {
                identifier: connectOptions.identifier,
                name: discoveredPeripheral.name,
            };
            this.#peripherals[peripheral.identifier] = peripheral;
        } else {
            _console.assertWithError(
                peripheral.connectionState != "connected" && !peripheral.connectionState?.endsWith("ing"),
                `peripheral is in connectionState "${peripheral.connectionState}"`
            );
        }

        _console.log("connecting to peripheral", connectOptions);
        peripheral.connectionState = null;
        this.#checkPeripheralConnectionsPoll.start();
        if (isInApp) {
            this.#onPeripheralConnectionState({ identifier: connectOptions.identifier, connectionState: "connecting" });
        }
        return this.#sendMessageToApp({ type: "connect", connectOptions });
    }
    /** @param {string} identifier */
    async disconnect(identifier) {
        const peripheral = this.#assertValidPeripheralIdentifier(identifier);
        _console.assertWithError(
            !peripheral.connectionState.includes("disconnect"),
            "peripheral is already disconnected or disconnecting"
        );
        peripheral.connectionState = null;
        this.#checkPeripheralConnectionsPoll.start();
        _console.log("disconnecting from peripheral...", peripheral);
        if (isInApp) {
            this.#onPeripheralConnectionState({ identifier, connectionState: "disconnecting" });
        }
        return this.#sendMessageToApp({ type: "disconnect", identifier });
    }

    /** @returns {CBCentralAppMessage[]} */
    #checkPeripheralConnectionsMessage() {
        const peripheralsWithPendingConnections = Object.values(this.#peripherals).filter(
            (peripheral) => !peripheral.connectionState || peripheral.connectionState?.endsWith("ing")
        );
        if (peripheralsWithPendingConnections.length > 0) {
            return peripheralsWithPendingConnections.map((peripheral) => {
                return { type: "peripheralConnectionState", identifier: peripheral.identifier };
            });
        } else {
            this.#checkPeripheralConnectionsPoll.stop();
            return [];
        }
    }
    #checkPeripheralConnectionsPoll = new AppMessagePoll(
        this.#checkPeripheralConnectionsMessage.bind(this),
        this.#prefix,
        200
    );

    /** @type {boolean} */
    #checkConnectedPeripheralsOnLoad = false;
    get checkConnectedPeripheralsOnLoad() {
        return this.#checkConnectedPeripheralsOnLoad;
    }
    set checkConnectedPeripheralsOnLoad(newValue) {
        _console.assertTypeWithError(newValue, "boolean");
        this.#checkConnectedPeripheralsOnLoad = newValue;
    }

    /** @param {string[]} serviceUUIDs */
    checkConnectedPeripherals(serviceUUIDs) {
        _console.log("checkConnectedPeripherals", { serviceUUIDs });
        this.#sendMessageToApp({ type: "connectedPeripherals", serviceUUIDs });
    }

    /** @param {CBPeripheral[]} connectedPeripherals */
    #onConnectedPeripherals(connectedPeripherals) {
        connectedPeripherals.forEach((connectedPeripheral) => {
            this.#peripherals[connectedPeripheral.identifier] = connectedPeripheral;
            this.#onPeripheralConnectionState(
                {
                    identifier: connectedPeripheral.identifier,
                    connectionState: connectedPeripheral.connectionState,
                },
                true
            );
            if (Object.values(connectedPeripheral.services).length > 0) {
                this.#onGetServices(
                    {
                        identifier: connectedPeripheral.identifier,
                        services: connectedPeripheral.services,
                    },
                    true
                );
            }
        });
    }

    /**
     * @param {CBPeripheralConnectionState} peripheralConnectionState
     * @param {boolean} override
     */
    #onPeripheralConnectionState(peripheralConnectionState, override = false) {
        const peripheral = this.#assertValidPeripheralIdentifier(peripheralConnectionState.identifier);
        if (peripheral.connectionState == peripheralConnectionState.connectionState && !override) {
            return;
        }
        peripheral.connectionState = peripheralConnectionState.connectionState;
        this.#dispatchEvent({ type: "peripheralConnectionState", message: { peripheral } });

        if (this.#hasAtLeastOneConnectedConnectedPeripheral) {
            this.#checkDisconnectionsPoll.start();
        } else {
            this.#checkDisconnectionsPoll.stop();
        }
    }

    get #hasAtLeastOneConnectedConnectedPeripheral() {
        return Object.values(this.peripherals).some((peripheral) => peripheral.connectionState == "connected");
    }

    #checkDisconnectionsPoll = new AppMessagePoll({ type: "disconnectedPeripherals" }, this.#prefix, 2000);
    /** @param {string[]} disconnectedPeripheralIdentifiers */
    #onDisconnectedPeripherals(disconnectedPeripheralIdentifiers) {
        disconnectedPeripheralIdentifiers.forEach((disconnectedPeripheralIdentifier) => {
            this.#onPeripheralConnectionState({
                identifier: disconnectedPeripheralIdentifier,
                connectionState: "disconnected",
            });
        });
    }

    /** @param {...string} identifiers  */
    async readPeripheralRSSIs(...identifiers) {
        identifiers.forEach((identifier) => {
            const peripheral = this.#assertValidPeripheralIdentifier(identifier);
            peripheral._pendingRSSI = true;
        });
        if (identifiers.length > 0) {
            this.#checkPeripheralRSSIsPoll.start();
            this.#sendMessageToApp({ type: "readRSSI", identifiers });
        }
    }
    /** @param {string} identifier  */
    async readPeripheralRSSI(identifier) {
        return this.readPeripheralRSSIs(identifier);
    }

    #checkPeripheralRSSIsPoll = new AppMessagePoll(this.#checkPeripheralRSSIsMessage.bind(this), this.#prefix, 200);

    /** @returns {CBCentralAppMessage[]} */
    #checkPeripheralRSSIsMessage() {
        const peripheralsWithPendingRSSIs = Object.values(this.#peripherals).filter(
            (peripheral) => peripheral._pendingRSSI
        );
        if (peripheralsWithPendingRSSIs.length > 0) {
            return {
                type: "getRSSI",
                peripherals: peripheralsWithPendingRSSIs.map((peripheral) => ({
                    identifier: peripheral.identifier,
                    timestamp: peripheral.rssiTimestamp,
                })),
            };
        } else {
            this.#checkPeripheralRSSIsPoll.stop();
            return [];
        }
    }

    /** @param {CBPeripheralRSSI[]} peripheralRSSIs */
    #onPeripheralRSSIs(peripheralRSSIs) {
        peripheralRSSIs.forEach((peripheralRSSI) => {
            const peripheral = this.#peripherals[peripheralRSSI.identifier];
            if (peripheral) {
                peripheral.rssi = peripheralRSSI.rssi;
                peripheral.rssiTimestamp = peripheralRSSI.timestamp;
                peripheral._pendingRSSI = false;
                this.#dispatchEvent({ type: "peripheralRSSI", message: { peripheral } });
                if (this.#hasAtLeastOnePendingRSSIPeripheral) {
                    this.#checkPeripheralRSSIsPoll.stop();
                }
            } else {
                _console.error("no peripheral found for peripheralRSSI", peripheralRSSI);
            }
        });
    }

    get #hasAtLeastOnePendingRSSIPeripheral() {
        return Object.values(this.peripherals).some((peripheral) => peripheral._pendingRSSI);
    }

    /**
     * @param {string} identifier
     * @param {string[]?} serviceUUIDs
     */
    async discoverServices(identifier, serviceUUIDs) {
        const peripheral = this.#assertConnectedPeripheralIdentifier(identifier);
        if (serviceUUIDs) {
            serviceUUIDs = serviceUUIDs.filter((serviceUUID) => {
                if (peripheral.services[serviceUUID]) {
                    _console.error("already have service", { peripheral, serviceUUID });
                    return false;
                }
                return true;
            });
        }
        _console.log("discovering services", { identifier, serviceUUIDs });
        this.#getServicesPoll.start();

        if (!peripheral._pendingServices) {
            peripheral._pendingServices = [];
        }
        if (serviceUUIDs?.length > 0) {
            peripheral._pendingServices.push(...serviceUUIDs);
        }
        return this.#sendMessageToApp({ type: "discoverServices", identifier, serviceUUIDs });
    }
    /**
     * @param {string} identifier
     * @param {string} serviceUUID
     */
    async discoverService(identifier, serviceUUID) {
        return this.discoverServices(identifier, [serviceUUID]);
    }

    #getServicesPoll = new AppMessagePoll(this.#getServicesMessage.bind(this), this.#prefix, 100);
    /** @returns {CBCentralAppMessage[]} */
    #getServicesMessage() {
        /** @type {CBCentralAppMessage[]} */
        const messages = [];
        Object.values(this.#peripherals)
            .filter((peripheral) => peripheral.connectionState == "connected" && peripheral._pendingServices)
            .forEach((peripheral) => {
                const message = {
                    type: "getServices",
                    identifier: peripheral.identifier,
                    serviceUUIDs: peripheral._pendingServices,
                };
                if (peripheral._pendingServices.length == 0) {
                    message.serviceUUIDs = null;
                }
                messages.push(message);
            });

        if (messages.length == 0) {
            this.#getServicesPoll.stop();
        }

        return messages;
    }

    /**
     * @param {string} identifier
     * @param {string} serviceUUID
     * @param {string[]?} includedServiceUUIDs
     */
    async discoverIncludedServices(identifier, serviceUUID, includedServiceUUIDs) {
        const peripheral = this.#assertConnectedPeripheralIdentifier(identifier);
        this.#assertValidServiceUUID(identifier, serviceUUID);
        includedServiceUUIDs = includedServiceUUIDs.filter((includedServiceUUID) => {
            if (peripheral.services[includedServiceUUID]) {
                _console.error("already have includedService", { peripheral, includedServiceUUID });
                return false;
            }
            return true;
        });
        _console.log("discovering includedServices", { identifier, serviceUUID, includedServiceUUIDs });
        peripheral._pendingIncludedServices.push(...includedServiceUUIDs);
        this.#getIncludedServicesPoll.start();
        return this.#sendMessageToApp({
            type: "discoverIncludedServices",
            identifier,
            serviceUUID,
            includedServiceUUIDs,
        });
    }
    /**
     * @param {string} identifier
     * @param {string} serviceUUID
     * @param {string} includedServiceUUID
     * @returns
     */
    async discoverIncludedService(identifier, serviceUUID, includedServiceUUID) {
        return this.discoverIncludedServices(identifier, serviceUUID, [includedServiceUUID]);
    }

    #getIncludedServicesPoll = new AppMessagePoll(this.#getIncludedServicesMessage.bind(this), this.#prefix, 500);
    /** @returns {CBCentralAppMessage[]} */
    #getIncludedServicesMessage() {
        // FILL - later
    }

    /**
     * @param {string} identifier
     * @param {string} serviceUUID
     * @param {string[]?} characteristicUUIDs
     */
    async discoverCharacteristics(identifier, serviceUUID, characteristicUUIDs) {
        const { service } = this.#assertValidServiceUUID(identifier, serviceUUID);
        if (characteristicUUIDs) {
            characteristicUUIDs = characteristicUUIDs.filter((characteristicUUID) => {
                if (service.characteristics[characteristicUUID]) {
                    _console.error("already have characteristic", { peripheral, characteristicUUID });
                    return false;
                }
                return true;
            });
        }
        _console.log("discovering characteristics", { identifier, serviceUUID, characteristicUUIDs });
        if (!service._pendingCharacteristics) {
            service._pendingCharacteristics = [];
        }
        if (characteristicUUIDs) {
            service._pendingCharacteristics.push(...characteristicUUIDs);
        }
        this.#getCharacteristicsPoll.start();
        return this.#sendMessageToApp({
            type: "discoverCharacteristics",
            identifier,
            serviceUUID,
            characteristicUUIDs,
        });
    }

    /**
     * @param {string} identifier
     * @param {string} serviceUUID
     * @param {string} characteristicUUID
     */
    async discoverCharacteristic(identifier, serviceUUID, characteristicUUID) {
        return this.discoverCharacteristics(identifier, serviceUUID, [characteristicUUID]);
    }

    #getCharacteristicsPoll = new AppMessagePoll(this.#getCharacteristicsMessage.bind(this), this.#prefix, 500);
    /** @returns {CBCentralAppMessage[]} */
    #getCharacteristicsMessage() {
        /** @type {CBCentralAppMessage[]} */
        const messages = [];

        Object.values(this.#peripherals)
            .filter((peripheral) => peripheral.connectionState == "connected")
            .forEach((peripheral) => {
                Object.values(peripheral.services)
                    .filter((service) => service._pendingCharacteristics)
                    .forEach((service) => {
                        const message = {
                            type: "getCharacteristics",
                            identifier: peripheral.identifier,
                            serviceUUID: service.uuid,
                            characteristicUUIDs: service._pendingCharacteristics,
                        };
                        if (service._pendingCharacteristics.length == 0) {
                            delete message.characteristicUUIDs;
                        }
                        messages.push(message);
                    });
            });

        if (messages.length == 0) {
            this.#getCharacteristicsPoll.stop();
        }

        return messages;
    }

    /**
     * @param {string} identifier
     * @param {string} serviceUUID
     * @param {string} characteristicUUID
     */
    async readCharacteristicValue(identifier, serviceUUID, characteristicUUID) {
        const { characteristic } = this.#assertValidCharacteristicUUID(identifier, serviceUUID, characteristicUUID);
        _console.log("reading characteristic value", { identifier, serviceUUID, characteristicUUID });
        characteristic._pendingValue = true;
        this.#getCharacteristicValuesPoll.start();
        return this.#sendMessageToApp({
            type: "readCharacteristicValue",
            identifier,
            serviceUUID,
            characteristicUUID,
        });
    }
    /**
     * @param {string} identifier
     * @param {string} serviceUUID
     * @param {string} characteristicUUID
     * @param {number[]} data
     */
    async writeCharacteristicValue(identifier, serviceUUID, characteristicUUID, data) {
        const peripheral = this.#assertConnectedPeripheralIdentifier(identifier);
        const { service, characteristic } = this.#assertValidCharacteristicUUID(
            identifier,
            serviceUUID,
            characteristicUUID
        );
        _console.log("reading characteristic data", { peripheral, service, characteristic, data });
        if (characteristic.properties.read) {
            characteristic._pendingValue = true;
            this.#getCharacteristicValuesPoll.start();
        }
        return this.#sendMessageToApp({
            type: "writeCharacteristicValue",
            identifier,
            serviceUUID,
            characteristicUUID,
            data,
        });
    }

    #getCharacteristicValuesPoll = new AppMessagePoll(
        this.#getCharacteristicValuesMessage.bind(this),
        this.#prefix,
        200
    );
    /** @returns {CBCentralAppMessage[]} */
    #getCharacteristicValuesMessage() {
        /** @type {CBCentralAppMessage[]} */
        const messages = [];
        Object.values(this.#peripherals).forEach((peripheral) => {
            var shouldRequestUpdatedValues = false;
            Object.values(peripheral.services).some((service) => {
                Object.values(service.characteristics).some((characteristic) => {
                    if (characteristic._pendingValue || characteristic.isNotifying) {
                        shouldRequestUpdatedValues = true;
                    }
                    return shouldRequestUpdatedValues;
                });
                return shouldRequestUpdatedValues;
            });

            if (shouldRequestUpdatedValues) {
                messages.push({
                    type: "updatedCharacteristicValues",
                    identifier: peripheral.identifier,
                    timestamp: peripheral._characteristicValueTimestamp || 0,
                });
            }
        });

        if (messages.length > 0) {
            return messages;
        } else {
            this.#getCharacteristicValuesPoll.stop();
        }
    }

    /**
     * @param {string} identifier
     * @param {string} serviceUUID
     * @param {string} characteristicUUID
     * @param {boolean} notifyValue
     */
    async setCharacteristicNotifyValue(identifier, serviceUUID, characteristicUUID, notifyValue) {
        const peripheral = this.#assertConnectedPeripheralIdentifier(identifier);
        const { characteristic } = this.#assertValidCharacteristicUUID(identifier, serviceUUID, characteristicUUID);
        _console.assertWithError(
            characteristic.properties.notify && characteristic.isNotifying != notifyValue,
            `characteristic isNotifying already has value "${notifyValue}"`
        );
        _console.log("setting characteristic notify value", {
            identifier,
            serviceUUID,
            characteristicUUID,
            notifyValue,
        });
        characteristic._pendingIsNotifying = true;
        this.#getCharacteristicNotifyValuesPoll.start();
        return this.#sendMessageToApp({
            type: "setCharacteristicNotifyValue",
            identifier,
            serviceUUID,
            characteristicUUID,
            notifyValue,
        });
    }

    #getCharacteristicNotifyValuesPoll = new AppMessagePoll(
        this.#getCharacteristicNotifyValuesMessage.bind(this),
        this.#prefix,
        100
    );
    /** @returns {CBCentralAppMessage[]} */
    #getCharacteristicNotifyValuesMessage() {
        /** @type {CBCentralAppMessage[]} */
        const messages = [];

        Object.values(this.#peripherals).forEach((peripheral) => {
            Object.values(peripheral.services).forEach((service) => {
                Object.values(service.characteristics).forEach((characteristic) => {
                    if (characteristic._pendingIsNotifying) {
                        messages.push({
                            type: "getCharacteristicNotifyValue",
                            identifier: peripheral.identifier,
                            serviceUUID: service.uuid,
                            characteristicUUID: characteristic.uuid,
                        });
                    }
                });
            });
        });

        if (messages.length == 0) {
            this.#getCharacteristicNotifyValuesPoll.stop();
        }
        return messages;
    }

    /**
     *
     * @param {string} identifier
     * @param {string} serviceUUID
     * @param {string} characteristicUUID
     */
    async discoverDescriptors(identifier, serviceUUID, characteristicUUID) {
        this.#assertValidCharacteristicUUID(identifier, serviceUUID, characteristicUUID);
        _console.log("discovering descriptors", {
            identifier,
            serviceUUID,
            characteristicUUID,
        });
        // FILL - poll for descriptors (later)
        this.#getDescriptorsPoll.start();
        return this.#sendMessageToApp({
            type: "discoverDescriptors",
            identifier,
            serviceUUID,
            characteristicUUID,
        });
    }

    #getDescriptorsPoll = new AppMessagePoll(this.#getDescriptorsMessage.bind(this), this.#prefix, 500);
    /** @returns {CBCentralAppMessage[]} */
    #getDescriptorsMessage() {
        // FILL - later
    }

    /**
     *
     * @param {string} identifier
     * @param {string} serviceUUID
     * @param {string} characteristicUUID
     * @param {string} descriptorUUID
     * @param {number} timestamp
     */
    async readDescriptorValue(identifier, serviceUUID, characteristicUUID, descriptorUUID, timestamp) {
        this.#assertValidDescriptorUUID(identifier, serviceUUID, characteristicUUID, descriptorUUID);
        _console.log("reading descriptor value", {
            identifier,
            serviceUUID,
            characteristicUUID,
            descriptorUUID,
            timestamp,
        });
        return this.#sendMessageToApp({
            type: "readDescriptorValue",
            identifier,
            serviceUUID,
            characteristicUUID,
            descriptorUUID,
            timestamp,
        });
    }
    /**
     *
     * @param {string} identifier
     * @param {string} serviceUUID
     * @param {string} characteristicUUID
     * @param {string} descriptorUUID
     * @param {any} value
     */
    async writeDescriptorValue(identifier, serviceUUID, characteristicUUID, descriptorUUID, value) {
        this.#assertValidDescriptorUUID(identifier, serviceUUID, characteristicUUID, descriptorUUID);
        _console.log("writing descriptor value", {
            identifier,
            serviceUUID,
            characteristicUUID,
            descriptorUUID,
            value,
        });
        // FILL - later
        this.#getDescriptorValuesPoll.start();
        return this.#sendMessageToApp({
            type: "writeDescriptorValue",
            identifier,
            serviceUUID,
            characteristicUUID,
            descriptorUUID,
            value,
        });
    }

    #getDescriptorValuesPoll = new AppMessagePoll(this.#getDescriptorValuesMessage.bind(this), this.#prefix, 500);
    /** @returns {CBCentralAppMessage[]} */
    #getDescriptorValuesMessage() {
        // FILL - later
    }

    /**
     * @param {object} object
     * @param {string} object.identifier
     * @param {Object.<string, CBService>} object.services
     * @param {boolean} override
     */
    #onGetServices({ identifier, services }, override = false) {
        const peripheral = this.#assertConnectedPeripheralIdentifier(identifier);
        if (!peripheral.services) {
            peripheral.services = [];
        }
        const newServices = Object.values(services).filter((service) => {
            if (!peripheral.services[service.uuid] || override) {
                _console.log("got service", { identifier, service });
                peripheral.services[service.uuid] = service;
                this.#dispatchEvent({ type: "discoveredService", message: { discoveredService: service, peripheral } });
                return true;
            } else {
                _console.warn("already have service", { identifier, service });
            }
        });

        if (peripheral._pendingServices) {
            peripheral._pendingServices = peripheral._pendingServices.filter(
                (serviceUUID) => !peripheral.services[serviceUUID]
            );
            if (peripheral._pendingServices.length == 0) {
                delete peripheral._pendingServices;
            }
        }

        this.#dispatchEvent({ type: "discoveredServices", message: { discoveredServices: newServices, peripheral } });

        Object.values(services).forEach((service) => {
            if (Object.values(service.characteristics).length > 0) {
                this.#onGetCharacteristics(
                    {
                        identifier: identifier,
                        serviceUUID: service.uuid,
                        characteristics: service.characteristics,
                    },
                    true
                );
            }
        });
    }

    /**
     * @param {object} object
     * @param {string} object.identifier
     * @param {string} object.serviceUUID
     * @param {CBService[]} object.includedServices
     */
    #onGetIncludedServices({ identifier, serviceUUID, includedServices }) {
        const { peripheral, service } = this.#assertValidServiceUUID(identifier, serviceUUID);
        const newDiscoveredIncludedServices = includedServices.filter((includedService) => {
            if (!peripheral.services[includedService.uuid]) {
                _console.log("got included service", { identifier, service, includedService });
                peripheral.services[includedService.uuid] = includedService;
                this.#dispatchEvent({
                    type: "discoveredIncludedService",
                    message: { discoveredIncludedService: includedService, peripheral, service },
                });
                this.#dispatchEvent({
                    type: "discoveredService",
                    message: { discoveredService: includedService, peripheral, service },
                });
                return true;
            } else {
                _console.warn("already have service", { identifier, includedService, service });
            }
        });

        this.#dispatchEvent({
            type: "discoveredIncludedServices",
            message: { discoveredIncludedServices: newDiscoveredIncludedServices, peripheral, service },
        });
        this.#dispatchEvent({
            type: "discoveredServices",
            message: { discoveredServices: newDiscoveredIncludedServices, peripheral, service },
        });
    }

    /**
     * @param {object} object
     * @param {string} object.identifier
     * @param {string} object.serviceUUID
     * @param {Object.<string, CBCharacteristic>} object.characteristics
     * @param {boolean} override
     */
    #onGetCharacteristics({ identifier, serviceUUID, characteristics }, override = false) {
        const { peripheral, service } = this.#assertValidServiceUUID(identifier, serviceUUID);
        const newCharacteristics = Object.values(characteristics).filter((characteristic) => {
            _console.log("got new characteristic", { identifier, service, characteristic });
            if (!service.characteristics[characteristic.uuid] || override) {
                service.characteristics[characteristic.uuid] = characteristic;
                this.#dispatchEvent({
                    type: "discoveredCharacteristic",
                    message: { discoveredCharacteristic: characteristic, peripheral, service },
                });
            } else {
                _console.warn("already have characteristic", { identifier, characteristic });
            }
        });

        if (service._pendingCharacteristics) {
            service._pendingCharacteristics = service._pendingCharacteristics.filter(
                (characteristicUUID) => !service.characteristics[characteristicUUID]
            );
            if (service._pendingCharacteristics.length == 0) {
                delete service._pendingCharacteristics;
            }
        }

        if (this.#hasAtLeastOneCharacteristicWithNotifyEnabled) {
            this.#getCharacteristicValuesPoll.start();
        }

        this.#dispatchEvent({
            type: "discoveredCharacteristics",
            message: { discoveredCharacteristics: newCharacteristics, peripheral, service },
        });
    }

    /**
     * @param {object} object
     * @param {string} object.identifier
     * @param {string} object.serviceUUID
     * @param {string} object.characteristicUUID
     * @param {number[]} object.value
     * @param {number} object.timestamp
     */
    #onGetCharacteristicValue({ identifier, serviceUUID, characteristicUUID, value, timestamp }) {
        const { peripheral, service, characteristic } = this.#assertValidCharacteristicUUID(
            identifier,
            serviceUUID,
            characteristicUUID
        );
        characteristic.value = value;
        characteristic.valueTimestamp = timestamp;
        this.#dispatchEvent({ type: "characteristicValue", message: { peripheral, service, characteristic } });
    }

    /**
     * @param {object} object
     * @param {string} object.identifier
     * @param {string} object.serviceUUID
     * @param {string} object.characteristicUUID
     * @param {boolean} object.isNotifying
     */
    #onGetCharacteristicNotifyValue({ identifier, serviceUUID, characteristicUUID, isNotifying }) {
        const { peripheral, service, characteristic } = this.#assertValidCharacteristicUUID(
            identifier,
            serviceUUID,
            characteristicUUID
        );

        if (characteristic.isNotifying != isNotifying) {
            _console.log("characteristic.isNotifying updated", { characteristic });
            characteristic.isNotifying = isNotifying;
            characteristic._pendingIsNotifying = false;
            this.#dispatchEvent({
                type: "characteristicNotifyValue",
                message: { peripheral, service, characteristic },
            });

            if (this.#hasAtLeastOneCharacteristicWithNotifyEnabled) {
                this.#getCharacteristicValuesPoll.start();
            }
        }
    }

    get #hasAtLeastOneCharacteristicWithNotifyEnabled() {
        return Object.values(this.peripherals)
            .filter((peripheral) => peripheral.connectionState == "connected")
            .some((peripheral) => {
                return Object.values(peripheral.services).some((service) => {
                    return Object.values(service.characteristics).some((characteristic) => characteristic.isNotifying);
                });
            });
    }

    /**
     * @param {CBUpdatedCharacteristicValue[]} updatedCharacteristicValues
     */
    #onUpdatedCharacteristicValues(updatedCharacteristicValues) {
        updatedCharacteristicValues.forEach((updatedCharacteristic) => {
            const { identifier, serviceUUID, characteristicUUID, value, timestamp } = updatedCharacteristic;
            const { peripheral, service, characteristic } = this.#assertValidCharacteristicUUID(
                identifier,
                serviceUUID,
                characteristicUUID
            );
            characteristic.value = value;
            characteristic.valueTimestamp = timestamp;
            _console.log("updated characteristicValue", { characteristic });
            this.#dispatchEvent({ type: "characteristicValue", message: { peripheral, service, characteristic } });
        });
    }

    /**
     * @param {object} object
     * @param {string} object.identifier
     * @param {string} object.serviceUUID
     * @param {string} object.characteristicUUID
     * @param {CBDescriptor[]} object.descriptors
     */
    #onGetDescriptors({ identifier, serviceUUID, characteristicUUID, descriptors }) {
        const { peripheral, service, characteristic } = this.#assertValidCharacteristicUUID(
            identifier,
            serviceUUID,
            characteristicUUID
        );

        const newDescriptors = descriptors.filter((descriptor) => {
            _console.log("got new descriptor", { peripheral, service, characteristic, descriptor });
            if (!characteristic.descriptors[descriptor.uuid]) {
                characteristic.descriptors[descriptor.uuid] = descriptor;
                this.#dispatchEvent({
                    type: "discoveredDescriptor",
                    message: { discoveredDescriptor: descriptor, peripheral, service, characteristic },
                });
            } else {
                _console.warn("already have descriptor", { peripheral, service, characteristic, descriptor });
            }
        });

        this.#dispatchEvent({
            type: "discoveredDescriptors",
            message: { peripheral, service, characteristic, discoveredDescriptors: newDescriptors },
        });
    }

    /**
     * @param {object} object
     * @param {string} object.identifier
     * @param {string} object.serviceUUID
     * @param {string} object.characteristicUUID
     * @param {string} object.descriptorUUID
     * @param {CBDescriptorValue} object.value
     */
    #onGetDescriptorValue({ identifier, serviceUUID, characteristicUUID, descriptorUUID, value }) {
        const { peripheral, service, characteristic, descriptor } = this.#assertValidDescriptorUUID(
            identifier,
            serviceUUID,
            characteristicUUID,
            descriptorUUID
        );
        descriptor.value = value;
        _console.log("descriptorValue", { descriptor });
        this.#dispatchEvent({ type: "descriptorValue", message: { peripheral, service, characteristic, descriptor } });
    }

    /** @param {CBCentralAppMessage} message */
    #onAppMessage(message) {
        _console.log(`received background message of type ${message.type}`, message);
        const { type } = message;
        switch (type) {
            case "state":
                _console.log("received state message", message.state);
                this.#onState(message.state);
                break;

            case "isScanning":
                _console.log("received isScanning message", message.isScanning);
                this.#onIsScanning(message.isScanning);
                break;
            case "discoveredPeripheral":
                _console.log("received discoveredPeripheral message", message.discoveredPeripheral);
                this.#onDiscoveredPeripheral(message.discoveredPeripheral);
                break;

            case "discoveredPeripherals":
                _console.log("received discoveredPeripherals message", message.discoveredPeripherals);
                this.#onDiscoveredPeripherals(message.discoveredPeripherals);
                break;
            case "peripheralConnectionState":
                _console.log("received peripheralConnectionState message", message.peripheralConnectionState);
                this.#onPeripheralConnectionState(message.peripheralConnectionState);
                break;
            case "connectedPeripherals":
                _console.log("received connectedPeripherals message", message.connectedPeripherals);
                this.#onConnectedPeripherals(message.connectedPeripherals);
                break;
            case "disconnectedPeripherals":
                _console.log("received disconnectedPeripherals message", message.disconnectedPeripherals);
                this.#onDisconnectedPeripherals(message.disconnectedPeripherals);
                break;

            case "getRSSI":
                _console.log("received getRSSI message", message.peripheralRSSIs);
                this.#onPeripheralRSSIs(message.peripheralRSSIs);
                break;

            case "getServices":
                _console.log("received getServices message", message.getServices);
                this.#onGetServices(message.getServices);
                break;
            case "getIncludedServices":
                _console.log("received getIncludedServices message", message.getIncludedServices);
                this.#onGetIncludedServices(message.getIncludedServices);
                break;

            case "getCharacteristics":
                _console.log("received getCharacteristics message", message.getCharacteristics);
                this.#onGetCharacteristics(message.getCharacteristics);
                break;
            case "getCharacteristicValue":
                _console.log("received getCharacteristicValue message", message.getCharacteristicValue);
                this.#onGetCharacteristicValue(message.getCharacteristicValue);
                break;
            case "getCharacteristicNotifyValue":
                _console.log("received getCharacteristicNotifyValue message", message.getCharacteristicNotifyValue);
                this.#onGetCharacteristicNotifyValue(message.getCharacteristicNotifyValue);
                break;
            case "updatedCharacteristicValues":
                _console.log("received updatedCharacteristicValues message", message.updatedCharacteristicValues);
                this.#onUpdatedCharacteristicValues(message.updatedCharacteristicValues);
                break;

            case "getDescriptors":
                _console.log("received getDescriptors message", message.getDescriptors);
                this.#onGetDescriptors(message.getDescriptors);
                break;
            case "getDescriptorValue":
                _console.log("received getDescriptorValue message", message.getDescriptorValue);
                this.#onGetDescriptorValue(message.getDescriptorValue);
                break;

            default:
                throw Error(`uncaught message type ${type}`);
        }
    }
}

export default CBCentralManager.shared;

import EventDispatcher from "./utils/EventDispatcher.js";
import { createConsole } from "./utils/Console.js";
import Timer from "./utils/Timer.js";

import { sendMessageToApp, addAppListener } from "./utils/messaging.js";
import AppMessagePoll from "./utils/AppMessagePoll.js";

const _console = createConsole("CBCentral", { log: true });

/** @typedef {"state" | "startScan" | "stopScan" | "isScanning" | "discoveredPeripherals" | "discoveredPeripheral" | "connect" | "disconnect" | "disconnectAll" | "peripheralConnectionState"} CBMessageType */

/** @typedef {"state" | "isAvailable" | "isScanning" | "discoveredPeripheral" | "peripheralConnectionState" | "expiredDiscoveredPeripheral"} CBEventType */

/** @typedef {import("./utils/EventDispatcher.js").EventDispatcherOptions} EventDispatcherOptions */

/** @typedef {import("./utils/messaging.js").NKMessage} NKMessage */

/**
 * @typedef CBMessage
 * @type {object}
 * @property {CBMessageType} type
 * @property {object} message
 */

/**
 * @typedef CBAppMessage
 * @type {object}
 * @property {CBMessageType} type
 */

/**
 * @typedef CBEvent
 * @type {object}
 * @property {CBEventType} type
 * @property {object} message
 */

/**
 * @typedef {(event: CBEvent) => void} CBEventListener
 */

/** @typedef {"unknown" | "resetting" | "unsupported" | "unauthorized" | "poweredOff" | "poweredOn"} CBState */

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

/** @typedef {"disconnected" | "conecting" | "connected" | "disconnecting" | "unknown"} CBConnectionState */
/**
 * @typedef CBPeripheralConnectionState
 * @type {object}
 * @property {string} identifier
 * @property {CBConnectionState} connectonState
 */

/**
 * @typedef CBPeripheral
 * @type {object}
 * @property {string} identifier
 * @property {CBConnectionState?} connectonState
 */

class CBCentralManager {
    /** @type {CBEventType[]} */
    static #EventsTypes = ["state", "isAvailable", "isScanning", "discoveredPeripheral", "expiredDiscoveredPeripheral"];
    /** @type {CBEventType[]} */
    get eventTypes() {
        return CBCentralManager.#EventsTypes;
    }
    #eventDispatcher = new EventDispatcher(this.eventTypes);

    /**
     * @param {CBEventType} type
     * @param {CBEventListener} listener
     * @param {EventDispatcherOptions?} options
     */
    addEventListener(type, listener, options) {
        return this.#eventDispatcher.addEventListener(...arguments);
    }
    /**
     * @param {CBEventType} type
     * @param {CBEventListener} listener
     * @returns {boolean}
     */
    removeEventListener(type, listener) {
        return this.#eventDispatcher.removeEventListener(...arguments);
    }
    /**
     * @param {CBEventType} type
     * @param {CBEventListener} listener
     * @returns {boolean}
     */
    hasEventListener(type, listener) {
        return this.#eventDispatcher.hasEventListener(...arguments);
    }
    /** @param {CBEvent} event */
    dispatchEvent(event) {
        return this.#eventDispatcher.dispatchEvent(event);
    }

    static #shared = new CBCentralManager();
    static get shared() {
        return this.#shared;
    }
    #prefix = "cbc";
    /**
     * @param {CBMessage[]} messages
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
        /** @type {CBMessage[]} */
        const messages = [];
        if (this.checkStateOnLoad) {
            messages.push({ type: "state" });
        }
        return this.#formatMessages(messages);
    }
    /** @returns {NKMessage[]?} */
    #getWindowUnloadMessages() {
        /** @type {CBMessage[]} */
        const messages = [];
        if (this.#isScanning && this.#stopScanOnUnload) {
            messages.push({ type: "stopScan" });
        }
        if (this.#disconnectOnUnload) {
            messages.push({ type: "disconnectAll" });
        }
        return this.#formatMessages(messages);
    }

    /** @param {CBAppMessage} message */
    async sendMessageToApp(message) {
        message.type = `${this.#prefix}-${message.type}`;
        return sendMessageToApp(message);
    }

    /** @type {boolean} */
    #checkStateOnLoad = false;
    get checkStateOnLoad() {
        return this.#checkStateOnLoad;
    }
    /** @throws {Error} if newValue is not a boolean */
    set checkStateOnLoad(newValue) {
        _console.assertWithError(typeof newValue == "boolean", "invalid newValue for checkStateOnLoad", newValue);
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

    /** @type {CBState?} */
    #state = null;
    get state() {
        return this.#state || "unknown";
    }
    /** @param {CBState} newState */
    #onState(newState) {
        if (this.#state == newState) {
            return;
        }

        this.#state = newState;
        _console.log("updated state", this.state);
        this.dispatchEvent({ type: "state", message: { state: this.state } });
        this.dispatchEvent({ type: "isAvailable", message: { isAvailable: this.isAvailable } });

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
        this.dispatchEvent({
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
        return this.sendMessageToApp({ type: "isScanning" });
    }
    #isScanningPoll = new AppMessagePoll({ type: "isScanning" }, this.#prefix, 50);

    #checkDiscoveredPeripherals() {
        const now = Date.now();

        /** @type {CBDiscoveredPeripheral[]} */
        const expiredDiscoveredPeripherals = [];

        this.#discoveredPeripherals = this.#discoveredPeripherals.filter((discoveredPeripheral) => {
            const hasExpired = now - discoveredPeripheral.lastTimeUpdated > 4000;
            if (hasExpired) {
                expiredDiscoveredPeripherals.push(discoveredPeripheral);
            }
            return !hasExpired;
        });

        expiredDiscoveredPeripherals.forEach((expiredDiscoveredPeripheral) => {
            _console.log({ expiredDiscoveredPeripheral });
            this.dispatchEvent({ type: "expiredDiscoveredPeripheral", expiredDiscoveredPeripheral });
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
        return this.sendMessageToApp({ type: "startScan", scanOptions });
    }
    async stopScan() {
        this.#assertIsAvailable();
        _console.assertWithError(this.isScanning, "already not scanning");
        _console.log("stopping scan");
        this.#isScanningPoll.start();
        return this.sendMessageToApp({ type: "stopScan" });
    }

    async toggleScan() {
        this.#assertIsAvailable();
        if (this.isScanning) {
            return this.stopScan();
        } else {
            return this.startScan();
        }
    }

    /** @type {CBDiscoveredPeripheral[]} */
    #discoveredPeripherals = [];
    get discoveredPeripherals() {
        return this.#discoveredPeripherals;
    }
    /** @param {string} identifier */
    #getDiscoveredPeripheralByIdentifier(identifier) {
        return this.#discoveredPeripherals.find(
            (discoveredPeripheral) => discoveredPeripheral.identifier == identifier
        );
    }
    /** @param {string} identifier */
    #assertValidDiscoveredPeripheralIdentifier(identifier) {
        _console.assertWithError(
            this.#getDiscoveredPeripheralByIdentifier(identifier),
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
        var discoveredPeripheral = this.#discoveredPeripherals.find(
            (discoveredPeripheral) => discoveredPeripheral.identifier == newDiscoveredPeripheral.identifier
        );
        if (discoveredPeripheral) {
            Object.assign(discoveredPeripheral, newDiscoveredPeripheral);
        } else {
            this.#discoveredPeripherals.push(newDiscoveredPeripheral);
            discoveredPeripheral = newDiscoveredPeripheral;
        }
        discoveredPeripheral.lastTimeUpdated = Date.now();
        this.dispatchEvent({ type: "discoveredPeripheral", message: { discoveredPeripheral } });
    }
    #discoveredPeripheralsPoll = new AppMessagePoll({ type: "discoveredPeripherals" }, this.#prefix, 200);

    /** @type {CBPeripheral[]} */
    #peripherals = [];
    get peripherals() {
        return this.#peripherals;
    }
    /** @param {string} identifier */
    #getPeripheralByIdentifier(identifier) {
        return this.#peripherals.find((connectedPeripheral) => connectedPeripheral.identifier == identifier);
    }
    /** @param {string} identifier */
    #assertValidPeripheralIdentifier(identifier) {
        _console.assertWithError(
            this.#getPeripheralByIdentifier(identifier),
            `no peripheral with identifier "${identifier}" found`
        );
    }

    /** @param {CBConnectOptions} connectOptions */
    async connect(connectOptions) {
        this.#assertIsAvailable();
        this.#assertValidDiscoveredPeripheralIdentifier(connectOptions.identifier);
        var peripheral = this.#getPeripheralByIdentifier(connectOptions.identifier);
        if (!peripheral) {
            peripheral = { identifier: connectOptions.identifier, connectonState: null };
            this.#peripherals.push(peripheral);
        } else {
            _console.assertWithError(
                peripheral.connectonState != "connected" && !peripheral.connectonState.endsWith("ing"),
                `peripheral is in connectionState "${peripheral.connectonState}"`
            );
        }
        _console.log("connecting to peripheral", connectOptions);
        this.#checkPeripheralConnectionsPoll.start();
        return this.sendMessageToApp({ type: "connect", connectOptions });
    }
    /** @param {string} identifier */
    async disconnect(identifier) {
        // FILL
        this.#assertValidPeripheralIdentifier(identifier);
        const peripheral = this.#getPeripheralByIdentifier(connectOptions.identifier);
    }

    /** @returns {CBAppMessage[]} */
    #checkPeripheralConnectionsMessage() {
        return this.#peripherals
            .filter((peripheral) => !peripheral.connectonState || peripheral.connectonState.endsWith("ing"))
            .map((peripheral) => {
                return { type: "peripheralConnectionState", identifier: peripheral.identifier };
            });
    }
    #checkPeripheralConnectionsPoll = new AppMessagePoll(
        this.#checkPeripheralConnectionsMessage.bind(this),
        this.#prefix,
        200
    );

    /** @param {CBPeripheralConnectionState} peripheralConnectionState  */
    #onPeripheralConnectionState(peripheralConnectionState) {}

    /** @param {CBAppMessage} message */
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
            default:
                throw Error(`uncaught message type ${type}`);
        }
    }
}

export default CBCentralManager.shared;

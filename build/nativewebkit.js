/**
 * @license
 * Copyright 2023 NativeWebKit.js Zack Qattan
 * SPDX-License-Identifier: MIT
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.NativeWebKit = factory());
})(this, (function () { 'use strict';

	class NativeWebKit {
	    static x = 10;
	}

	return NativeWebKit;

}));

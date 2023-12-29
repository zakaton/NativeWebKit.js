import terser from "@rollup/plugin-terser";
import MagicString from "magic-string";

function header() {
    return {
        renderChunk(code) {
            code = new MagicString(code);

            code.prepend(`/**
 * @license
 * Copyright 2023 NativeWebKit.js Zack Qattan
 * SPDX-License-Identifier: MIT
 */\n`);

            return {
                code: code.toString(),
                map: code.generateMap(),
            };
        },
    };
}

const builds = [
    {
        input: "src/NativeWebKit.js",
        plugins: [header()],
        output: [
            {
                format: "esm",
                file: "build/nativewebkit.module.js",
            },
        ],
    },
    {
        input: "src/NativeWebKit.js",
        plugins: [header(), terser()],
        output: [
            {
                format: "esm",
                file: "build/nativewebkit.module.min.js",
            },
        ],
    },
    {
        input: "src/NativeWebKit.js",
        plugins: [header()],
        output: [
            {
                format: "umd",
                name: "NativeWebKit",
                file: "build/nativewebkit.js",
                indent: "\t",
            },
        ],
    },
    {
        input: "src/NativeWebKit.js",
        plugins: [header(), terser()],
        output: [
            {
                format: "umd",
                name: "NativeWebKit",
                file: "build/nativewebkit.min.js",
            },
        ],
    },

    {
        input: "src/polyfill.js",
        plugins: [header()],
        output: [
            {
                format: "umd",
                file: "build/polyfill/nativewebkit-polyfill.js",
                indent: "\t",
            },
        ],
    },
    {
        input: "src/polyfill.js",
        plugins: [header(), terser()],
        output: [
            {
                format: "umd",
                file: "build/polyfill/nativewebkit-polyfill.min.js",
            },
        ],
    },
];

export default builds;

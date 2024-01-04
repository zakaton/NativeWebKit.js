import terser from "@rollup/plugin-terser";
import MagicString from "magic-string";
import replace from "@rollup/plugin-replace";

function header() {
    return {
        renderChunk(code) {
            code = new MagicString(code);

            code.prepend(`/**
 * @copyright Zack Qattan 2024
 * @license MIT
 */\n`);

            return {
                code: code.toString(),
                map: code.generateMap(),
            };
        },
    };
}

function replaceEnvironment() {
    return replace({
        preventAssignment: true,
        values: {
            __NATIVEWEBKIT__ENVIRONMENT__: JSON.stringify("__NATIVEWEBKIT__PROD__"),
        },
    });
}

const builds = [
    {
        input: "src/NativeWebKit.js",
        plugins: [replaceEnvironment(), header()],
        output: [
            {
                format: "esm",
                file: "build/nativewebkit.module.js",
            },
        ],
    },
    {
        input: "src/NativeWebKit.js",
        plugins: [replaceEnvironment(), header(), terser()],
        output: [
            {
                format: "esm",
                file: "build/nativewebkit.module.min.js",
            },
        ],
    },
    {
        input: "src/NativeWebKit.js",
        plugins: [replaceEnvironment(), header()],
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
        plugins: [replaceEnvironment(), header(), terser()],
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
        plugins: [replaceEnvironment(), header()],
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
        plugins: [replaceEnvironment(), header(), terser()],
        output: [
            {
                format: "umd",
                file: "build/polyfill/nativewebkit-polyfill.min.js",
            },
        ],
    },
];

export default builds;

/** @type {import("forge.lint").IForgeLintConfig} */
const config = {
    // files and folders with your commands, events and custom functions
    include: ["src"],

    // folders with custom functions, like the `functions` option of ForgeClient. They must be compiled .js
    // functions: "./functions",

    // functions ForgeLint can't find in your files, for example ones whose names are built in code.
    // They are never reported as unknown
    // known: ["$swordPrice"],

    // "error", "warning", "info" or "off" for each rule
    // rules: { "function-case": "off" },
}

module.exports = config

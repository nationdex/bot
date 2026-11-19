/** @type {import("forge.lint").IForgeLintConfig} */
module.exports = {
    // Detect ForgeScript definitions and calls throughout the bot source.
    include: ["src"],
    exclude: ["src/bundle-imports.ts"],
    // Keep the indentation already used by each code block.
    alignToKey: false,
}

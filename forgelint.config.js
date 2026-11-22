/** @type {import("forge.lint").IForgeLintConfig} */
module.exports = {
    // Detect ForgeScript definitions and calls throughout the bot source.
    include: ["src"],
    exclude: ["src/bundle-imports.ts"],
    // Keep the indentation already used by each code block.
    alignToKey: false,
}

// ForgeLint 1.1 scans .js files. Bridge public TypeScript exports under Bun,
// retaining the actual NativeFunction metadata instead of loose known names.
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, 'node_modules', '.cache', 'nationdex-forgelint');
fs.mkdirSync(root, { recursive: true });
for (const [name, specifier, exported] of [
    ['db', '@nationdex/db/functions', 'functions'],
    ['api', '@nationdex/api', 'apiFunctions'],
]) {
    const items = require(specifier)[exported];
    const dir = path.join(root, name);
    fs.mkdirSync(dir, { recursive: true });
    for (const file of fs.readdirSync(dir)) {
        if (/^function-\d+\.js$/.test(file)) fs.unlinkSync(path.join(dir, file));
    }
    items.forEach((_, index) => fs.writeFileSync(
        path.join(dir, 'function-' + index + '.js'),
        '// NativeFunction({\nmodule.exports = require(' + JSON.stringify(specifier) + ').' + exported + '[' + index + '];\n',
    ));
}
const pndDir = path.join(root, 'pnd');
fs.mkdirSync(pndDir, { recursive: true });
for (const file of fs.readdirSync(pndDir)) {
    if (/^function-\d+\.js$/.test(file)) fs.unlinkSync(path.join(pndDir, file));
}
fs.writeFileSync(
    path.join(pndDir, 'function-0.js'),
    '// NativeFunction({\nmodule.exports = require(' + JSON.stringify(path.join(pndDir, '..', '..', '..', '..', 'src/functions/extras/extrasOperation.ts')) + ');\n',
);
module.exports.extensions = ['@tryforge/forge.canvas'];
module.exports.natives = [path.join(root, 'db'), path.join(root, 'api'), pndDir];

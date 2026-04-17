import type { NativeFunction } from "@tryforge/forgescript";
import { customFunctions } from "../functions";
import path from "node:path"; 
import { getEnabledPackages } from "./package";
import { pathToFileURL } from "bun";
import { existsSync } from "node:fs";

export async function discoverFunctions(): Promise<NativeFunction[]> {
    const functions: NativeFunction[] = [];

    const basePath = path.join(process.cwd(), "node_modules");

    for (const packageName of getEnabledPackages().keys()) {
        const packagePath = path.join(basePath, packageName, "functions", "index.ts");

        if (!existsSync(packagePath)) continue;

        const module = await import(pathToFileURL(packagePath).href);

        if (!module || !module.default || !Array.isArray(module.default)) continue;

        functions.push(...module.default);
    }

    return functions;
}

/**
 * Gets functions packages and 3rd party functions.
 */
export async function getFunctions(): Promise<NativeFunction[]> {
    const extraFunctions = await discoverFunctions();
    return [...customFunctions, ...extraFunctions];
}

/**
 * Gets only 3rd party functions
 */
export async function getExtraFunctions(): Promise<NativeFunction[]> {
    return await discoverFunctions();
}

/**
 * Gets only default functions
 */
export async function getDefaultFunctions(): Promise<NativeFunction[]> {
    return customFunctions;
}
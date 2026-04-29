import path from "node:path"; 
import { getEnabledPackages } from "./package";
import { existsSync, readdirSync, statSync } from "node:fs";

/**
 * Discover all 3rd party functions and returns paths
 */
export async function discoverFunctions(): Promise<string[]> {
    const functions: string[] = [];

    const basePath = path.join(process.cwd(), "node_modules");

    for (const packageName of getEnabledPackages().keys()) {
        const functionsPath = path.join(basePath, packageName, "functions");

        if (!existsSync(functionsPath)) continue;
        const stat = statSync(functionsPath);
        if (!stat.isDirectory()) continue;

        functions.push(path.relative(process.cwd(), functionsPath))
    }

    return functions;
}
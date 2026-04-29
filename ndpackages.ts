import { logger } from "./src/logger";
import { existsSync, readFileSync } from "node:fs";
import { parse } from "toml";

const major = Number(process.versions.node.split(".")[0]);

if (!Number.isNaN(major) && major < 18) {
    logger.error("Minimal node version to run this file: Node V18.")
    process.exit(1);
}

type Package = {
    name: string;
    location: string;
    enabled: boolean;
}

function getPackages(packages: Package[]) {
    const pkgs = packages.filter((x) => x.enabled && x.location)
    .map((x) => x.location)
    .join(" ")

    console.log(pkgs)
}

function main(file: string) {
    if (!existsSync(file)) {
        logger.warn("No extra.toml file found.")
        return;
    }

    const content = readFileSync(file, "utf-8");
    const data = parse(content);

    const nationdex = data.nationdex ?? {};
    const pkgs: Package[] = nationdex.packages ?? [];

    getPackages(pkgs);
}

if (process.argv.length != 3) {
    logger.error("Usage: bun run ndpackages.ts <extra.toml>")
    process.exit(1);
}

// @ts-expect-error
main(process.argv[2]);
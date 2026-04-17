import { join } from "node:path"
import { logger } from "../logger";
import { existsSync, readFileSync } from "node:fs";
import { parse } from "toml";
import { Collection } from "discord.js";

type Package = {
    name: string;
    location: string;
    enabled: boolean;
}

export function getPackages(): Collection<string, Package> {
    const packages: Collection<string, Package> = new Collection();
    const path = join(process.cwd(), "config", "extra.toml")
    if (!existsSync(path)) {
        logger.warn("No extra.toml file found.")
        return packages;
    }

    const content = readFileSync(path, "utf-8");
    const data = parse(content);

    const nationdex = data.nationdex ?? {};
    const pkgs: Package[] = nationdex.packages ?? []
    for (const pkg of pkgs) {
        packages.set(pkg.name, pkg);
    }
    return packages;
}

export function getEnabledPackages(): Collection<string, Package> {
    const pkgs = getPackages();
    return pkgs.filter((x) => x.enabled)
}
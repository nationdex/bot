import { ForgeClient } from "@tryforge/forgescript";
import { logger } from "../logger";
import { config } from "../../config/config";
import { DB_CONFIG } from "../db/connection";
import { ForgeDB } from "@tryforge/forge.db";
import { ForgeCanvas } from "@tryforge/forge.canvas";
import { db } from "../db";
import { sql } from "drizzle-orm";
import { type ActivityType, Collection } from "discord.js"
import { getPackages } from "../packages";
import path from "node:path";
import type { Package } from "../types";

export class Client extends ForgeClient {
    packages: Collection<string, Package> = new Collection();

    constructor() {
        if (!config.token) {
            logger.error('Missing bot token in config. Please set config.token.');
            process.exit(1);
        }

        if (!DB_CONFIG.password) {
            logger.error(
                'Missing database password. Set the POSTGRES_PASSWORD environment variable before starting the bot.'
            );
            process.exit(1);
        }

        super({
            intents: ["Guilds", "GuildMessages", "GuildEmojisAndStickers", "MessageContent"],
            events: ['messageCreate', 'clientReady'],
            prefixes: [config.prefix],
            extensions: [
                new ForgeDB({
                type: 'postgres',
                host: DB_CONFIG.host,
                port: DB_CONFIG.port,
                username: DB_CONFIG.user,
                password: DB_CONFIG.password,
                database: DB_CONFIG.database,
                }),
                new ForgeCanvas(),
            ],
            presence: {
                status: config.status,
                activities: [
                    {
                        name: config.activity.name,
                        type: config.activity.type as unknown as ActivityType
                    }
                ]
            }
        })

        // this.loadFunctions();
    }

    private async loadCommands() {
        try {
            const packages = await getPackages();
            for (const pkg of packages) {
                this.packages.set(pkg.name, pkg);
            }
            const commands = packages.flatMap((pkg) => pkg.commands);

            this.applicationCommands.add(commands);
            this.groupNationsSubcommands(this.applicationCommands);
        } catch (e) {
            logger.error("Failed to load package commands.", e)
        }
    }

    /**
     * Moves the prog command out of the flat command registry and nests it under a
     * subcommand group named after `config.appearance.commands.collectibles`.
     * Also sets the manager's path so toJSON() can find nations/config.json for
     * the group description.
     */
    private groupNationsSubcommands(appCmds: ForgeClient['applicationCommands']) {
        const { collectibles, prog } = config.appearance.commands;

        // Access ForgeScript's internal command registry.
        const mgr = appCmds as unknown as {
            path: string;
            commands: Collection<string, unknown>;
        };

        const group = new Collection<string, unknown>();

        const progCmd = mgr.commands.get(prog.name);
        if (progCmd) {
            mgr.commands.delete(prog.name);
            group.set(prog.name, progCmd);
        }

        mgr.commands.set(collectibles, group);

        // Point at src/packages/ so toJSON() picks up nations/config.json for the
        // subcommand group description.
        mgr.path = path.join(process.cwd(), 'src/packages');
    }

    /**
     * Checks if DB credentials are valid.
     */
    private async checkDatabase() {
        try {
            await db.execute(sql`SELECT 1`);
            logger.info("Database connection verified");
        } catch (e) {
            logger.warn(
                [
                    "PostgreSQL is not reachable — commands that read/write user data will ",
                    "fail until the database is available. Check that the DB container ",
                    "is running before starting the bot."
                ].join(""),
                e
            )
        }
    }

    public async start(token?: string | undefined): Promise<string> {
        try {
            await this.loadCommands();
            for (const pkg of this.packages.values()) {
                const names = pkg.commands.map((c: { data: { name: string } }) => c.data.name).join(', ');
                logger.info(
                    `Loaded package "${pkg.name}" (${pkg.commands.length} command(s)${names ? `: ${names}` : ', grouped'})`
                );
            };

            // there isn't need to load applications commands using method applicationCommands.registerGlobal()
            // as this.login() already does this
            await this.checkDatabase();
            return await this.login(token);
        } catch (e) {
            logger.error("Failed to connect with discord api.", e)
            return "";
        }
    }
}
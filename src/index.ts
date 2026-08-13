import { ForgeCanvas } from "@tryforge/forge.canvas";
import { ForgeDB } from "@nationdex/db";
import { ForgeClient } from "@tryforge/forgescript";
import { config } from "./config/config";

const db = new ForgeDB({
	type: "surrealdb",
	engine: "surrealkv",
	folder: "./database",
	namespace: "forge",
	database: "forge.db",
});

const canvas = new ForgeCanvas();

const dex = new ForgeClient({
	intents: ["GuildMessages", "MessageContent"],
	events: ["messageCreate", "interactionCreate", "clientReady"],
	prefixes: config.prefixes,
	extensions: [db, canvas],
});

const flushAndExit = async () => {
	try {
		const dataSource = (dex as any)?.db?.db;
		if (typeof dataSource?.close === "function") {
			await dataSource.close();
			console.log("database connection closed");
		}
	} catch {
		// ignore
	}
	process.exit(0);
};

process.on("SIGINT", flushAndExit);
process.on("SIGTERM", flushAndExit);

db.variables(require("../src/config/variables.json"));
dex.functions.load("dist/functions");
dex.commands.load("dist/commands");
dex.applicationCommands.load("dist/slash");

dex.login(config.token);

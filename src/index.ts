import { ForgeCanvas } from "@tryforge/forge.canvas";
import { ForgeDB } from "@tryforge/forge.db";
import { ForgeClient } from "@tryforge/forgescript";
import { config } from "./config/config";

const db = new ForgeDB({
	type: "better-sqlite3",
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
		if (typeof dataSource?.query === "function") {
			await dataSource.query("PRAGMA wal_checkpoint(TRUNCATE);");
			console.log("success");
		} else {
			console.log("unsuccess");
		}
	} catch {
		console.log("unsuccess");
	}
	process.exit(0);
};

process.on("SIGINT", flushAndExit);
process.on("SIGTERM", flushAndExit);

db.variables(require("../src/config/variables.json"));
dex.functions.load("dist/functions");
dex.commands.load("dist/commands");
dex.applicationCommands.load("dist/slash");

dex.login(config.token).then(() => {
	setTimeout(async () => {
		try {
			const dataSource = (dex as any)?.db?.db;
			if (typeof dataSource?.query === "function") {
				await dataSource.query("PRAGMA journal_mode=WAL;");
				await dataSource.query("PRAGMA synchronous=NORMAL;");
				console.log("success");
			} else {
				console.log("unsuccess");
			}
		} catch {
			console.log("unsuccess");
		}
	}, 2000);
});

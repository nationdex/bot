import { ForgeCanvas } from "@tryforge/forge.canvas"
import { ForgeDB } from "@tryforge/forge.db"
import { ForgeClient } from "@tryforge/forgescript"
import { config } from "./config/config"

const db = new ForgeDB({
  type: "better-sqlite3"
});

const canvas = new ForgeCanvas();

const client = new ForgeClient({
  intents: [
    "Guilds",
    "GuildMessages",
    "GuildMembers",
    "MessageContent",
    "DirectMessages",
    "DirectMessageReactions"
  ],
  events: [
    "messageCreate",
    "interactionCreate",
    "clientReady"
  ],
  prefixes: config.prefixes,
  extensions: [
    db,
    canvas
  ]
});

db.variables(require("../src/config/variables.json"));
client.functions.load("dist/functions");
client.commands.load("dist/commands");
client.applicationCommands.load("dist/slash");

client.login(config.token);
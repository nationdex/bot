const { ForgeClient } = require("@tryforge/forgescript");

const client = new ForgeClient({
	intents: ["GuildMessages", "MessageContent"],
	events: ["messageCreate", "clientReady"],
});

client.login("token");

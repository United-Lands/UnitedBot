import path from "path";
import { fileURLToPath } from "node:url";
import { Client, Events, GatewayIntentBits, Partials } from "discord.js";
import { ClientCommands } from "@/types/client.js";
import { config } from "@/config.js";
import { registerCommands } from "@/utils/commands-register.js";
import { onMemberJoin } from "@/events/memberJoin.js";
import { onThreadCreate } from "@/events/suggestionsCreate.js";
import { deployCommands } from "@/utils/commands-deploy.js";
import { onHoneypotMessage, setupHoneypotChannel } from "@/events/honeypot.js";

export const DIR_NAME = path.dirname(fileURLToPath(import.meta.url));

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
	],
	partials: [
		Partials.Channel
	]
}) as ClientCommands;

client.once(Events.ClientReady, async c => {
	console.log(`\nReady! Logged in as ${c.user.tag}`);
	await setupHoneypotChannel(c);
})

client.on(Events.GuildMemberAdd, onMemberJoin);
client.on(Events.ThreadCreate,   onThreadCreate);
client.on(Events.MessageCreate,  onHoneypotMessage);

await registerCommands(client);
await deployCommands();

client.login(config.token).catch(err => {
	console.error("Failed to login:", err);
})
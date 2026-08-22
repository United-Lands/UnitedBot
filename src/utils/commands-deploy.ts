import { REST, Routes } from "discord.js";
import { DIR_NAME } from "@/index.js";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "node:url";
import { config } from "@/config.js";

export async function deployCommands() {
	const commands: any[] = [];
	const commandFolder   = path.join(DIR_NAME, "commands");
	const commandFiles    = fs.readdirSync(commandFolder).filter((file) => file.endsWith(".ts"));

	for (const file of commandFiles) {
		const filePath = path.join(commandFolder, file);
		const command = await import(pathToFileURL(filePath).href);

		if (!command.data || !command.execute) {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
			continue;
		}

		commands.push(command.data.toJSON());
	}

	const rest = new REST().setToken(config.token);

	/* DEBUG: Deleting all commands
		rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: [] })

			.then(() => console.log("Successfully deleted all guild application (/) commands."))
			.catch(console.error);

		rest.put(Routes.applicationCommands(config.clientId), { body: [] })
			.then(() => console.log("Successfully deleted all global application (/) commands."))
			.catch(console.error);
	 */

	try {
		console.log(`Started reloading ${commands.length} application (/) commands...`);

		const data: any = await rest.put(
			Routes.applicationGuildCommands(config.clientId, config.guildId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
}
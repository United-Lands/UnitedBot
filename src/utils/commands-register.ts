import { ClientCommands } from "@/types/client.js";
import { Collection, Events, Interaction, MessageFlags } from "discord.js";
import path from "path";
import fs from "fs";
import { DIR_NAME } from "@/index.js";
import { pathToFileURL } from "node:url";
import { logCommandUsage } from "@/utils/utils.js";

export async function registerCommands(client: ClientCommands) {
    client.commands = new Collection();

    const commandFolder = path.join(DIR_NAME, "commands");
    const commandFiles  = fs.readdirSync(commandFolder).filter(file => file.endsWith(".ts"));

    for (const file of commandFiles) {
        const filePath = path.join(commandFolder, file);
        const command  = await import(pathToFileURL(filePath).href);

        if (!command.data || !command.execute) {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
            continue;
        }

        client.commands.set(command.data.name, command);
    }

    client.on(Events.InteractionCreate, async (interaction: Interaction) => {
        if (interaction.isAutocomplete())
            return client.commands.get(interaction.commandName)?.autocomplete?.(interaction)

        if (!interaction.isChatInputCommand())
            return;

        const command = client.commands.get(interaction.commandName);
        if (!command)
            return console.error(`No command matching ${interaction.commandName} was found.`);

        logCommandUsage(interaction);

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`Error executing ${interaction.commandName}`);
            console.error(error);

            const errorReply = { content: "There was an error while executing this command!", flags: MessageFlags.Ephemeral };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorReply as any);
            } else {
                await interaction.reply(errorReply as any);
            }
        }
    });
}
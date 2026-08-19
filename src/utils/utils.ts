import { AutocompleteInteraction, ChatInputCommandInteraction } from "discord.js";
import axios from "axios";

export const logCommandUsage = (interaction: ChatInputCommandInteraction) => {
    const timestamp = new Date().toISOString().replace("T", " | ").split(".")[0];
    console.log(`${timestamp} - ${interaction.user.username} - ${interaction}`);
}

export async function respondWithList(interaction: AutocompleteInteraction, url: string) {
    const focused = interaction.options.getFocused();
    const response = await axios.get(url);
    if (!response.data.success)
        return;

    const filtered = (response.data.data as string[])
        .filter(entry => entry.toLowerCase().startsWith(focused.toLowerCase()))
        .slice(0, 24);

    await interaction.respond(
        filtered.map(entry => ({ name: entry, value: entry }))
    );
}
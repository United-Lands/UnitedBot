import { AutocompleteInteraction } from "discord.js";
import { config } from "@/config.js";
import axios from "axios";

let lastCallTime = 0;
let cachedPlayers: string[] = [];

export async function autoCompletePlayers(interaction: AutocompleteInteraction) {
    if (Date.now() - lastCallTime > 60_000) {
        const response = await axios.get(config.apiBase + "/api/residents");
        if (response.data.success)
            cachedPlayers = (response.data.data as string[]).sort();

        lastCallTime = Date.now();
    }

    const focused = interaction.options.getFocused();
    const filtered = cachedPlayers
        .filter(player => player.toLowerCase().startsWith(focused.toLowerCase()))
        .sort()
        .slice(0, 24);

    await interaction.respond(
        filtered.map(player => ({ name: player, value: player }))
    );
}
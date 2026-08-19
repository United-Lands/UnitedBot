import { autoCompletePlayers } from "@/utils/players.js";
import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import axios from "axios";
import { config } from "@/config.js";

export const data = new SlashCommandBuilder()
    .setName("player")
    .setDescription("Gets information about a player.")
    .addStringOption(option =>
        option.setName("player-name").setDescription("Minecraft Name").setRequired(true).setAutocomplete(true)
    );

export const autocomplete = autoCompletePlayers;

export async function execute(interaction: ChatInputCommandInteraction) {

    const playerName = interaction.options.getString("player-name", true);
    const response   = await axios.get(config.apiBase + `/api/resident/${playerName}`);

    if (!response.data.success)
        return interaction.reply({ content: response.data.errorMessage, flags: MessageFlags.Ephemeral });

    const data    = response.data.data;
    const balance = Math.floor(data.balance).toLocaleString("en-US");
    const dateOptions: Intl.DateTimeFormatOptions = {
        year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "numeric", second: undefined, hour12: false
    }

    const embed = new EmbedBuilder()
        .setTitle(`👤 ${data.name}'s Information`)
        .setColor("#5ec467")
        .setThumbnail(`https://mc-heads.net/avatar/${playerName}.png/48/`)
        .addFields(
            { name: "Balance",        value: `${balance} G`, inline: true },
            { name: "Joined",         value: Intl.DateTimeFormat("en-US", dateOptions).format(new Date(data.joindate)),   inline: true },
            { name: "Last Online",    value: Intl.DateTimeFormat("en-US", dateOptions).format(new Date(data.lastonline)), inline: true },
            { name: "Total Playtime", value: data.playtime, inline: true }
        );

    if (data.town)
        embed.addFields({ name: "Town", value: data.town.name.replaceAll("_", " "), inline: true });

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}
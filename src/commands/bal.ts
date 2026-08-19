import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import axios from "axios";
import { config } from "@/config.js";
import { autoCompletePlayers } from "@/utils/players.js";

export const data = new SlashCommandBuilder()
    .setName('bal')
    .setDescription("Gets the balance of a player.")
    .addStringOption(option =>
        option.setName("player-name").setDescription("Minecraft Name").setRequired(true).setAutocomplete(true)
    );

export const autocomplete = autoCompletePlayers;

export async function execute(interaction: ChatInputCommandInteraction) {

    const playerName = interaction.options.getString("player-name", true);
    const response   = await axios.get(config.apiBase + `/api/resident/${playerName}`);

    if (!response.data.success)
        return interaction.reply({ content: response.data.errorMessage, flags: MessageFlags.Ephemeral });

    const balance = Math.floor(response.data.data.balance).toLocaleString("en-US");

    const embed = new EmbedBuilder()
        .setTitle(`🪙 ${response.data.data.name}'s Balance`)
        .setColor("#ffce08")
        .setDescription(`${balance} G`)
        .setThumbnail(`https://mc-heads.net/avatar/${playerName}.png/48/`);

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}
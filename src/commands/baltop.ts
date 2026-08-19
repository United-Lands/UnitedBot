import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import axios from "axios";
import { config } from "@/config.js";

export const data = new SlashCommandBuilder()
    .setName('baltop')
    .setDescription("Gets the current top 10 balance holders.")
    .addStringOption(option =>
        option.setName("bal-type").setDescription("Baltop type").addChoices(
            { name: 'player', value: 'player' },
            { name: 'town',   value: 'town' },
            { name: 'nation', value: 'nation' },
        )
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const balType = interaction.options.getString("bal-type") || "player";

    switch(balType) {
        case "player":
            return await sendPlayerBaltop(interaction);
        case "town":
            return await sendTownBaltop(interaction);
        case "nation":
            return await sendNationBaltop(interaction);

        default:
            await interaction.editReply({ content: 'The baltop type has to be player, town or nation' });
    }
}

async function sendPlayerBaltop(interaction: ChatInputCommandInteraction) {
    const response = await axios.get(config.apiBase + "/api/baltop");
    await replyWithBaltop(interaction, response, "🪙 Top 10 Richest Players 👤");
}

async function sendTownBaltop(interaction: ChatInputCommandInteraction) {
    const response = await axios.get(config.apiBase + "/api/baltoptown");
    await replyWithBaltop(interaction, response, "🪙 Top 10 Richest Towns 🏛️");
}

async function sendNationBaltop(interaction: ChatInputCommandInteraction) {
    const response = await axios.get(config.apiBase + "/api/baltopnation");
    await replyWithBaltop(interaction, response, "🪙 Top 10 Richest Nations 🌍");
}

async function replyWithBaltop(interaction: ChatInputCommandInteraction, response: any, title: string) {
    if (!response.data.success)
        return interaction.editReply({ content: response.data.errorMessage });

    const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor("#ffce08");

    if (response.data.data[0] == null)
        embed.setDescription("Baltop is being recalculated, please try again in a few seconds...");
    else {
        for (let i = 0; i < 10; i++) {
            if (response.data.data[i] == null)
                continue;

            embed.addFields({
                name: `${i + 1}. - ${response.data.data[i].name}`,
                value: `${Math.floor(response.data.data[i].balance).toLocaleString("en-US")} G`,
            });
        }
    }

    await interaction.editReply({ embeds: [embed] });
}
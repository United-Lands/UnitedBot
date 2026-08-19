import {
    AttachmentBuilder,
    AutocompleteInteraction, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, SlashCommandBuilder
} from "discord.js";
import { respondWithList } from "@/utils/utils.js";
import { config } from "@/config.js";
import axios from "axios";
import { cleanupMapFile, renderNationMap } from "@/utils/map-renderer.js";

export const data = new SlashCommandBuilder()
    .setName("nation")
    .setDescription("Gets information about a nation.")
    .addStringOption(option =>
        option.setName("nation-name").setDescription("Nation Name").setRequired(true).setAutocomplete(true)
    );

export const autocomplete = async (interaction: AutocompleteInteraction) =>
    await respondWithList(interaction, config.apiBase + "/api/nations");

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const nationName = interaction.options.getString("nation-name", true);
    const response   = await axios.get(config.apiBase + `/api/nation/${nationName}`);

    if (!response.data.success)
        return interaction.editReply({ content: response.data.errorMessage })

    const data = response.data.data;
    const dateOptions: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" };

    const embed = new EmbedBuilder()
        .setTitle(`🌍 ${ data.name.replaceAll("_", " ") }`)
        .setColor("#bf3250");

    if (data.type)
        embed.setDescription(`This nation is a **${data.type}**`);

    embed.addFields(
        { name: "Founded",        value: data.founded ? Intl.DateTimeFormat("en-US", dateOptions).format(new Date(data.founded)) : "(not recorded)", inline: true },
        { name: "Leader",         value: data.leader.name, inline: true },
        { name: "Capital",        value: data.capital.name.replaceAll("_", " "), inline: true },
        { name: "Residents",      value: `${data.resident_count}`, inline: true },
        { name: "Claims",         value: `${data.claim_count}`, inline: true },
        { name: "Nation Balance", value: `${Math.floor(data.balance).toLocaleString("en-US")} G`, inline: true },
        { name: "Daily Upkeep",   value: `${Math.floor(data.upkeep).toLocaleString("en-US")} G`, inline: true }
    );

    const towns = (data.towns as string[]).map((town) => `\`${town}\` `).join("");
    embed.addFields({ name: `Towns (${data.town_count})`, value: towns });

    await renderNationMap(data.uuid, data.blocks);

    const file = new AttachmentBuilder(`./output/${data.uuid}.png`)
    embed.setImage(`attachment://${data.uuid}.png`);

    await interaction.editReply({ embeds: [embed], files: [file] });
    await cleanupMapFile(data.uuid);
}
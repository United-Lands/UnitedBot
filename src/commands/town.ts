import {
    AttachmentBuilder,
    AutocompleteInteraction, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, SlashCommandBuilder
} from "discord.js";
import { respondWithList } from "@/utils/utils.js";
import { config } from "@/config.js";
import axios from "axios";
import { cleanupMapFile, renderTownMap } from "@/utils/map-renderer.js";

export const data = new SlashCommandBuilder()
    .setName("town")
    .setDescription("Gets information about a town.")
    .addStringOption(option =>
        option.setName("town-name").setDescription("Town Name").setRequired(true).setAutocomplete(true)
    );

export const autocomplete = async (interaction: AutocompleteInteraction) =>
    await respondWithList(interaction, config.apiBase + "/api/towns");

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const townName = interaction.options.getString("town-name", true);
    const response = await axios.get(config.apiBase + `/api/town/${townName}`);

    if (!response.data.success)
        return interaction.editReply({ content: response.data.errorMessage })

    const data = response.data.data;
    const dateOptions: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" };

    const embed = new EmbedBuilder()
        .setTitle(`🏛️ ${ data.name.replaceAll("_", " ") }`)
        .setColor("#538fbd")
        .addFields(
            { name: "Founded",      value: data.founded ? Intl.DateTimeFormat("en-US", dateOptions).format(new Date(data.founded)) : "(not recorded)", inline: true },
            { name: "Mayor",        value: data.mayor.name, inline: true },
            { name: "Nation",       value: data.nation ? data.nation.name.replaceAll("_", " ") : "(none)", inline: true },
            { name: "Public Spawn", value: data.is_public ? "Yes" : "No", inline: true },
            { name: "Location",     value: `[${data.loc_x * 16}, ${data.loc_z * 16}](https://map.unitedlands.net/?world=world_earth&renderer=basic&zoom=-1&x=${data.loc_x * 16}&z=${data.loc_z * 16})`, inline: true },
            { name: "Daily Tax",    value: `${Math.floor(data.tax).toLocaleString("en-US")}${data.is_tax_percent ? " %" : " G"}`, inline: true },
            { name: "Town Balance", value: `${Math.floor(data.balance).toLocaleString("en-US")} G`, inline: true },
            { name: "Daily Upkeep", value: `${Math.floor(data.upkeep).toLocaleString("en-US")} G`, inline: true },
            { name: "Size",         value: `${data.claim_count}`, inline: true },
            { name: "Residents",    value: `${data.resident_count}`, inline: true }
        );

    await renderTownMap(data.uuid, data.blocks, { x: data.loc_x, z: data.loc_z })

    const file = new AttachmentBuilder(`./output/${data.uuid}.png`)
    embed.setImage(`attachment://${data.uuid}.png`);

    await interaction.editReply({ embeds: [embed], files: [file] });
    await cleanupMapFile(data.uuid);
}
import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("ip")
    .setDescription("Gets the IP address of the server.");

export async function execute(interaction: ChatInputCommandInteraction) {

    await interaction.reply({
        content: "`play.unitedlands.net`",
        flags: MessageFlags.Ephemeral
    });

}
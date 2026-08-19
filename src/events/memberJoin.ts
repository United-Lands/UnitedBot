import { EmbedBuilder, GuildMember, userMention } from "discord.js";
import { config } from "@/config.js";

export async function onMemberJoin(member: GuildMember) {
    console.log(`${ member } joined.`)

    const welcomeEmbed = new EmbedBuilder()
        .setDescription(`**<:online:907644415793823745> Welcome ${ userMention(member.id) }!**`)
        .setColor("#44b383");

    const channel = await member.guild.channels.fetch(config.welcomeChId).catch(console.error);
    if (channel?.isSendable())
        await channel.send({ embeds: [welcomeEmbed] })

    await Promise.all(
        config.memberRoleIds.map(roleId => member.roles.add(roleId))
    )
}
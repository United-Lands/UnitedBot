import { Client, EmbedBuilder, GuildMember, Message } from "discord.js";
import { config } from "@/config.js";

export async function setupHoneypotChannel(client: Client) {
    if (!config.honeypotChId)
        return;

    const channel = await client.channels.fetch(config.honeypotChId).catch(console.error);
    if (!channel || !channel.isTextBased() || channel.isDMBased())
        return;

    const oldMessages   = await channel.messages.fetch({ limit: 10 });
    const alreadyPosted = oldMessages.some(msg => msg.author.id === client.user?.id && msg.embeds.length > 0);
    if (alreadyPosted)
        return;

    await Promise.all(oldMessages.map(msg => msg.delete().catch(() => {})))

    const warningEmbed = new EmbedBuilder()
        .setDescription(
            "### ⚠️ DO NOT SEND MESSAGES IN THIS CHANNEL\n_ _\n" +
            " This channel is used to catch spam bots.\n" +
            " Any message sent here will result in an **immediate kick**.\n\n" +
            "### ⚠️ DO NOT SEND MESSAGES IN THIS CHANNEL"
        )
        .setColor("#efeff1");

    await channel.send({ embeds: [ warningEmbed ] });
}

export async function onHoneypotMessage(message: Message) {
    if (message.channelId !== config.honeypotChId || message.author.bot)
        return;

    await message.delete().catch(console.error);

    const member = message.member;
    if (!member)
        return;

    const kickEmbed = new EmbedBuilder()
        .setTitle("🚫  You have been kicked from United Lands")
        .setDescription(
            "You sent a message in the honeypot channel, which is used to catch spam bots.\n\n" +
            "If this was an accident, feel free to rejoin and reach out to staff to explain what happened. " +
            "Repeated \"joke\" triggers will not be re-admitted."
        )
        .setColor("#e74c3c");

    try {
        await member.send({ embeds: [ kickEmbed ] }).catch(() => {})
        await member.kick("Posted in Honeypot channel");

        const purgedCount = await purgeRecentMessages(member);
        console.log(`${ member.user.tag } (${ member.id }) was kicked for posting in the honeypot channel. Purged ${ purgedCount } recent messages.`);
    } catch(err: Error | any) {
        if (err.code === 50013 && err.status === 403)
            return console.error(`Bypassing permissions prevented purging messages for ${ member.user.tag } (${ member.id }) after posting in the honeypot channel.`);

        return console.error(`Failed to purge messages for ${ member.user.tag } (${ member.id }) after posting in the honeypot channel:`, err);
    }

}

async function purgeRecentMessages(member: GuildMember): Promise<number> {

    const cutoff     = Date.now() - config.honeypotPurgeHrs * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const channel of member.guild.channels.cache.values()) {
        if (!channel.isTextBased() || channel.isDMBased())
            continue;

        const messages = await channel.messages.fetch({ limit: 100 }).catch(() => null);
        if (!messages)
            continue;

        const toDelete = messages.filter(msg => msg.author.id === member.id && msg.createdTimestamp >= cutoff);
        await Promise.all(toDelete.map(msg => msg.delete().catch(() => {})));
        deletedCount += toDelete.size;
    }

    return deletedCount;
}
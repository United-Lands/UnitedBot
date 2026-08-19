import { Client, EmbedBuilder, GuildMember, GuildTextBasedChannel, Message } from "discord.js";
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

    const member = message.member;
    if (!member)
        return;

    if (!member.kickable)
        return console.log(`${member.user.tag} (${member.id}) triggered the honeypot but can't be kicked (role hierarchy/permissions).`);

    const messageContent = message.content;

    await message.delete().catch(console.error);

    const kickEmbed = new EmbedBuilder()
        .setTitle("🚫  You have been kicked from United Lands")
        .setDescription(
            "You sent a message in the honeypot channel, which is used to catch spam bots.\n\n" +
            "If this was an accident, feel free to rejoin and reach out to staff to explain what happened. " +
            "Repeated \"joke\" triggers will not be re-admitted."
        )
        .setColor("#e74c3c");

    await member.send({ embeds: [ kickEmbed ] }).catch(() => {})

    try {
        await member.kick("Posted in Honeypot Channel");
    } catch(err: Error | any) {
        console.error(`Failed to kick ${ member.user.tag } (${ member.id }) after honypot trigger:`, err);
        return;
    }

    const purgedCount = await purgeRecentMessages(member);
    console.log(`${ member.user.tag } (${ member.id }) was kicked for posting in the honeypot channel. Purged ${ purgedCount } recent messages.`);

    await sendHoneypotLog(member, messageContent, purgedCount);
}

async function purgeRecentMessages(member: GuildMember): Promise<number> {

    const cutoff     = Date.now() - config.honeypotPurgeHrs * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const channel of member.guild.channels.cache.values()) {
        if (!channel.isTextBased() || channel.isDMBased())
            continue;

        deletedCount += await purgeUserMessagesInChannel(channel, member.id, cutoff);
    }

    return deletedCount;
}

async function purgeUserMessagesInChannel(channel: GuildTextBasedChannel, userId: string, cutoff: number): Promise<number> {
    const MAX_PAGES = 5;

    let deletedCount = 0;
    let before: string | undefined;

    for (let page = 0; page < MAX_PAGES; page++) {
        const batch = await channel.messages.fetch({ limit: 100, before }).catch(() => null);
        if (!batch || batch.size === 0)
            break;

        const toDelete = batch.filter(msg => msg.author.id === userId && msg.createdTimestamp >= cutoff);
        await Promise.all(toDelete.map(msg => msg.delete().catch(() => {})));
        deletedCount += toDelete.size;

        const oldest = batch.last();
        if (!oldest || oldest.createdTimestamp < cutoff)
            break;

        before = oldest.id;
    }

    return deletedCount;
}

async function sendHoneypotLog(member: GuildMember, messageContent: string, purgedCount: number) {
    if (!config.honeypotLogChId)
        return;

    const channel = await member.guild.channels.fetch(config.honeypotLogChId).catch(() => null);
    if (!channel || !channel.isTextBased() || channel.isDMBased())
        return;

    const logEmbed = new EmbedBuilder()
        .setColor("#e74c3c")
        .setAuthor({ name: `${member.user.tag} — Kicked`, iconURL: member.user.displayAvatarURL() })
        .addFields(
            { name: "User",             value: `${member}`, inline: true },
            { name: "Reason",           value: "Posted in Honeypot Channel", inline: true },
            { name: "Messages Purged",  value: `${purgedCount}`, inline: true },
            { name: "Honeypot Message", value: (messageContent || "*(no text content)*").slice(0, 1024) },
        )
        .setTimestamp();

    await channel.send({ embeds: [ logEmbed ] }).catch(console.error);
}
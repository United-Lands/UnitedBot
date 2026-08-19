import dotenv from "dotenv";

dotenv.config({ quiet: true })

const required = (key: string): string => {
    const value = process.env[key];
    if (!value)
        throw new Error(`Missing required environment variable: ${ key }`);

    return value;
}

export const config = {
    token:     required("DISCORD_TOKEN"),
    clientId:  required("DISCORD_CLIENT_ID"),
    guildId:   required("DISCORD_GUILD_ID"),

    apiBase:     required("API_BASE"),
    apiBaseDev:  required("API_BASE_DEV"),

    honeypotChId:      process.env.HONEYPOT_CHANNEL_ID,
    honeypotLogChId:   process.env.HONEYPOT_LOG_CHANNEL_ID,
    honeypotPurgeHrs:  Number(process.env.HONEYPOT_PURGE_HOURS) || 24,

    welcomeChId:    required("WELCOME_CHANNEL_ID"),
    memberRoleIds:  (process.env.MEMBER_ROLE_IDS || "").split(",").filter(Boolean),

    suggForumId:   process.env.SUGGESTIONS_FORUM_ID || "",
    suggUpvote:    required("SUGGESTIONS_UPVOTE"),
    suggDownvote:  required("SUGGESTIONS_DOWNVOTE"),
}
import { AnyThreadChannel } from "discord.js";
import { config } from "@/config.js";

export async function onThreadCreate(thread: AnyThreadChannel) {
    if (thread.parentId !== config.suggForumId)
        return;

    const starterMsg = await thread.fetchStarterMessage();
    if (!starterMsg)
        return;

    await starterMsg.react(config.suggUpvote);
    await starterMsg.react(config.suggDownvote);
}
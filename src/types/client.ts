import { Client, Collection } from "discord.js";

export interface ClientCommands extends Client{
    commands: Collection<string, any>
}
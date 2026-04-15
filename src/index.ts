import { config } from "../config/config";
import { Client } from "./core/bot";

const client = new Client();

client.start(config.token);

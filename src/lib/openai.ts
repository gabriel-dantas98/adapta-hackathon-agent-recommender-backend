import { ChatOpenAI } from "@langchain/openai";

export const openai = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-4o-mini",
  temperature: 0.2,
});

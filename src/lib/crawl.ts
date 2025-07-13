import env from "@/config/env";
import axios from "axios";
import z from "zod";

export const summarySchema = z.object({
  title: z.string(),
  summary: z.string(),
  images: z.array(z.string()),
  primaryColor: z.string(),
  secondaryColor: z.string(),
});

/* Given a URL, it starts a new crawl process and returns its ID. */
export async function startCrawlProcess(url: string) {
  const response = await axios.post(
    "https://api.firecrawl.dev/v1/crawl",
    {
      url: url,
      limit: 5,
      scrapeOptions: {
        formats: ["markdown"],
        onlyMainContent: true,
        parsePDF: true,
        maxAge: 14400000,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${env.FIRECRAWL_API_KEY}`,
      },
    },
  );

  return response.data.id;
}

async function getCrawlProcessStatus(id: string) {
  const response = await axios.get(`https://api.firecrawl.dev/v1/crawl/${id}`, {
    headers: {
      Authorization: `Bearer ${env.FIRECRAWL_API_KEY}`,
    },
  });
  return response.data;
}

/* Given a crawl process ID, it waits for the crawl result to be completed and then return the data. */
export async function waitForCrawlResult(id: string) {
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  while (true) {
    const currentStatus = await getCrawlProcessStatus(id);

    if (currentStatus.status === "completed") {
      return currentStatus;
    }

    if (currentStatus.status === "failed") {
      throw new Error(
        `Crawl process failed: ${currentStatus.error || "Unknown error"}`,
      );
    }

    await delay(10000); // Wait 10 seconds before trying again
  }
}

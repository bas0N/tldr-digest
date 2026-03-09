import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ScoredArticle } from "./filter.js";

export interface SummarizedArticle extends ScoredArticle {
  aiSummary: string;
}

const SUMMARIZE_PROMPT = `Generate concise 2-3 sentence summaries for each article below. Focus on:
- What it is (the key announcement/finding)
- Why it matters (impact/significance)
- Key insight (most interesting takeaway)

Return as JSON array:
[
  {
    "index": 0,
    "summary": "Your 2-3 sentence summary here."
  },
  ...
]

Articles to summarize:
`;

export async function summarizeArticles(
  articles: ScoredArticle[],
  apiKey: string
): Promise<SummarizedArticle[]> {
  if (articles.length === 0) {
    return [];
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const summarizedArticles: SummarizedArticle[] = [];

  // Process in batches
  const batchSize = 10;

  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize);

    const articlesText = batch
      .map(
        (article, idx) =>
          `[${idx}] "${article.title}"\nOriginal: ${article.summary}`
      )
      .join("\n\n");

    const prompt = SUMMARIZE_PROMPT + articlesText;

    try {
      console.log(
        `Summarizing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(articles.length / batchSize)}...`
      );

      const result = await model.generateContent(prompt);
      const response = result.response.text();

      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn("Failed to parse summary response, using original");
        for (const article of batch) {
          summarizedArticles.push({
            ...article,
            aiSummary: article.summary,
          });
        }
        continue;
      }

      const summaries: Array<{ index: number; summary: string }> = JSON.parse(
        jsonMatch[0]
      );

      for (const summaryData of summaries) {
        const article = batch[summaryData.index];
        if (article) {
          summarizedArticles.push({
            ...article,
            aiSummary: summaryData.summary,
          });
        }
      }
    } catch (error) {
      console.error("Error summarizing batch:", error);
      // Fallback to original summaries
      for (const article of batch) {
        summarizedArticles.push({
          ...article,
          aiSummary: article.summary,
        });
      }
    }

    // Rate limiting
    if (i + batchSize < articles.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log(`Generated summaries for ${summarizedArticles.length} articles`);

  return summarizedArticles;
}

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Article } from "./scraper.js";

export interface ScoredArticle extends Article {
  relevanceScore: number;
  reasoning: string;
}

const FILTER_PROMPT = `You are an AI article curator. Score each article for relevance to a tech professional interested in:
- AI agents, agentic systems, autonomous AI
- Developer tools and productivity
- Programming languages and frameworks
- Tech innovation and startups

For each article, provide:
1. A score from 1-10 (10 = highly relevant)
2. Brief reasoning (1 sentence)

IMPORTANT: Articles mentioning "agent", "agentic", "autonomous", or "AI assistant" should get bonus points (+2).

Return your response as valid JSON array:
[
  {
    "index": 0,
    "score": 8,
    "reasoning": "Direct coverage of AI agent development framework"
  },
  ...
]

Articles to evaluate:
`;

export async function filterArticles(
  articles: Article[],
  apiKey: string,
  minScore: number = 7
): Promise<ScoredArticle[]> {
  if (articles.length === 0) {
    return [];
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

  // Process in batches to avoid token limits
  const batchSize = 20;
  const scoredArticles: ScoredArticle[] = [];

  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize);

    const articlesText = batch
      .map(
        (article, idx) =>
          `[${idx}] "${article.title}" (${article.category})\n${article.summary}`
      )
      .join("\n\n");

    const prompt = FILTER_PROMPT + articlesText;

    try {
      console.log(
        `Filtering batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(articles.length / batchSize)}...`
      );

      const result = await model.generateContent(prompt);
      const response = result.response.text();

      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn("Failed to parse filter response, skipping batch");
        continue;
      }

      const scores: Array<{ index: number; score: number; reasoning: string }> =
        JSON.parse(jsonMatch[0]);

      for (const scoreData of scores) {
        const article = batch[scoreData.index];
        if (article && scoreData.score >= minScore) {
          scoredArticles.push({
            ...article,
            relevanceScore: scoreData.score,
            reasoning: scoreData.reasoning,
          });
        }
      }
    } catch (error) {
      console.error("Error filtering batch:", error);
    }

    // Rate limiting: wait between batches
    if (i + batchSize < articles.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Sort by relevance score (highest first)
  scoredArticles.sort((a, b) => b.relevanceScore - a.relevanceScore);

  console.log(
    `Filtered to ${scoredArticles.length} relevant articles (score >= ${minScore})`
  );

  return scoredArticles;
}

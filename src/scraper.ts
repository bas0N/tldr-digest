import * as cheerio from "cheerio";

export interface Article {
  title: string;
  url: string;
  summary: string;
  category: "tech" | "ai" | "dev";
}

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function fetchNewsletter(
  category: "tech" | "ai" | "dev"
): Promise<Article[]> {
  const dateStr = getTodayDateString();
  const url = `https://tldr.tech/${category}/${dateStr}`;

  console.log(`Fetching ${url}...`);

  const response = await fetch(url);

  if (!response.ok) {
    console.warn(
      `Failed to fetch ${category} newsletter (${response.status}). May not be published yet.`
    );
    return [];
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const articles: Article[] = [];

  // TLDR uses article blocks with specific structure
  // Each article typically has a header link and description
  $("article, .article, [class*='article']").each((_, element) => {
    const $el = $(element);
    const $link = $el.find("a").first();
    const title = $link.text().trim();
    const articleUrl = $link.attr("href") || "";

    // Get the summary/description text
    const summary = $el.find("p, .description, [class*='desc']").text().trim();

    if (title && articleUrl && summary) {
      articles.push({
        title,
        url: articleUrl,
        summary,
        category,
      });
    }
  });

  // Alternative parsing if article blocks aren't found
  if (articles.length === 0) {
    // Try parsing based on common TLDR structure with headers
    $("h3, h4, .headline").each((_, element) => {
      const $el = $(element);
      const $link = $el.find("a").first();
      let title = $link.text().trim() || $el.text().trim();
      const articleUrl = $link.attr("href") || "";

      // Get next sibling paragraph as summary
      const $next = $el.next("p, div");
      const summary = $next.text().trim();

      if (title && summary) {
        articles.push({
          title,
          url: articleUrl || "#",
          summary,
          category,
        });
      }
    });
  }

  // Third attempt: look for any linked content blocks
  if (articles.length === 0) {
    const seenUrls = new Set<string>();

    $("a[href]").each((_, element) => {
      const $link = $(element);
      const href = $link.attr("href") || "";

      // Skip internal/navigation links
      if (
        href.startsWith("#") ||
        href.includes("tldr.tech") ||
        href.includes("mailto:") ||
        seenUrls.has(href)
      ) {
        return;
      }

      const title = $link.text().trim();
      if (title.length < 10 || title.length > 200) return; // Skip too short/long

      // Try to get surrounding context as summary
      const $parent = $link.parent();
      const parentText = $parent.text().trim();
      const summary =
        parentText.length > title.length
          ? parentText.replace(title, "").trim()
          : "";

      if (title && summary.length > 20) {
        seenUrls.add(href);
        articles.push({
          title,
          url: href,
          summary: summary.slice(0, 500), // Limit summary length
          category,
        });
      }
    });
  }

  console.log(`Found ${articles.length} articles in ${category}`);
  return articles;
}

export async function scrapeAllNewsletters(): Promise<Article[]> {
  const categories: Array<"tech" | "ai" | "dev"> = ["tech", "ai", "dev"];

  const results = await Promise.all(categories.map(fetchNewsletter));

  return results.flat();
}

import { Resend } from "resend";
import type { SummarizedArticle } from "./summarizer.js";

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function groupByCategory(
  articles: SummarizedArticle[]
): Record<string, SummarizedArticle[]> {
  const groups: Record<string, SummarizedArticle[]> = {
    ai: [],
    tech: [],
    dev: [],
  };

  for (const article of articles) {
    groups[article.category].push(article);
  }

  return groups;
}

function getCategoryEmoji(category: string): string {
  switch (category) {
    case "ai":
      return "🤖";
    case "tech":
      return "💻";
    case "dev":
      return "⚡";
    default:
      return "📰";
  }
}

function getCategoryTitle(category: string): string {
  switch (category) {
    case "ai":
      return "AI & Machine Learning";
    case "tech":
      return "Tech News";
    case "dev":
      return "Developer Tools & Programming";
    default:
      return "Other";
  }
}

function generateEmailHtml(articles: SummarizedArticle[]): string {
  const grouped = groupByCategory(articles);
  const dateStr = formatDate();

  let sectionsHtml = "";

  for (const category of ["ai", "tech", "dev"]) {
    const categoryArticles = grouped[category];
    if (categoryArticles.length === 0) continue;

    const emoji = getCategoryEmoji(category);
    const title = getCategoryTitle(category);

    let articlesHtml = "";
    for (const article of categoryArticles) {
      articlesHtml += `
        <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #007bff;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px;">
            <a href="${article.url}" style="color: #1a1a2e; text-decoration: none;">${article.title}</a>
            <span style="font-size: 12px; color: #666; font-weight: normal;"> (${article.relevanceScore}/10)</span>
          </h3>
          <p style="margin: 0; color: #333; font-size: 14px; line-height: 1.5;">${article.aiSummary}</p>
        </div>
      `;
    }

    sectionsHtml += `
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 18px; color: #1a1a2e; border-bottom: 2px solid #eee; padding-bottom: 8px; margin-bottom: 15px;">
          ${emoji} ${title}
        </h2>
        ${articlesHtml}
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fff;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="font-size: 24px; color: #1a1a2e; margin-bottom: 5px;">📬 Daily Tech Digest</h1>
    <p style="color: #666; font-size: 14px; margin: 0;">${dateStr}</p>
    <p style="color: #888; font-size: 12px; margin-top: 5px;">
      ${articles.length} curated articles from TLDR newsletters
    </p>
  </div>

  ${sectionsHtml}

  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
    <p>Generated with AI-powered filtering and summarization</p>
    <p>Source: <a href="https://tldr.tech" style="color: #007bff;">tldr.tech</a></p>
  </div>
</body>
</html>
  `;
}

function generatePlainText(articles: SummarizedArticle[]): string {
  const grouped = groupByCategory(articles);
  const dateStr = formatDate();

  let text = `DAILY TECH DIGEST\n${dateStr}\n${articles.length} curated articles\n\n`;

  for (const category of ["ai", "tech", "dev"]) {
    const categoryArticles = grouped[category];
    if (categoryArticles.length === 0) continue;

    const title = getCategoryTitle(category);
    text += `\n=== ${title.toUpperCase()} ===\n\n`;

    for (const article of categoryArticles) {
      text += `${article.title} (${article.relevanceScore}/10)\n`;
      text += `${article.url}\n`;
      text += `${article.aiSummary}\n\n`;
    }
  }

  text += "\n---\nSource: tldr.tech\n";

  return text;
}

export async function sendDigestEmail(
  articles: SummarizedArticle[],
  apiKey: string,
  toEmail: string,
  fromEmail: string = "onboarding@resend.dev"
): Promise<void> {
  if (articles.length === 0) {
    console.log("No articles to send");
    return;
  }

  const resend = new Resend(apiKey);

  const html = generateEmailHtml(articles);
  const text = generatePlainText(articles);
  const dateStr = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  console.log(`Sending digest email to ${toEmail}...`);

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: toEmail,
    subject: `📬 Daily Tech Digest - ${dateStr} (${articles.length} articles)`,
    html,
    text,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  console.log("Email sent successfully!");
}

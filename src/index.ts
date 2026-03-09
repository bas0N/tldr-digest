import { scrapeAllNewsletters } from "./scraper.js";
import { filterArticles } from "./filter.js";
import { summarizeArticles } from "./summarizer.js";
import { sendDigestEmail } from "./emailer.js";

async function main() {
  console.log("🚀 Starting TLDR Daily Digest...\n");

  // Validate environment variables
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailTo = process.env.EMAIL_TO;
  const emailFrom = process.env.EMAIL_FROM || "onboarding@resend.dev";

  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY environment variable is required");
  }
  if (!emailTo) {
    throw new Error("EMAIL_TO environment variable is required");
  }

  // Step 1: Scrape newsletters
  console.log("📰 Step 1: Scraping TLDR newsletters...");
  const articles = await scrapeAllNewsletters();

  if (articles.length === 0) {
    console.log("No articles found. Newsletters may not be published yet.");
    return;
  }

  console.log(`Found ${articles.length} total articles\n`);

  // Step 2: Filter with AI
  console.log("🔍 Step 2: AI filtering for relevance...");
  const filteredArticles = await filterArticles(articles, geminiApiKey, 7);

  if (filteredArticles.length === 0) {
    console.log("No articles passed the relevance filter.");
    return;
  }

  console.log(`${filteredArticles.length} articles passed filter\n`);

  // Step 3: Generate summaries
  console.log("✍️  Step 3: Generating AI summaries...");
  const summarizedArticles = await summarizeArticles(
    filteredArticles,
    geminiApiKey
  );
  console.log("");

  // Step 4: Send email
  console.log("📧 Step 4: Sending email digest...");
  await sendDigestEmail(summarizedArticles, resendApiKey, emailTo, emailFrom);

  console.log("\n✅ Daily digest completed successfully!");
}

main().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});

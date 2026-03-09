#!/bin/bash
# TLDR Digest - GitHub Secrets Setup
# Requires: gh CLI installed and authenticated (gh auth login)

set -e

echo "====================================="
echo "TLDR Digest - GitHub Secrets Setup"
echo "====================================="
echo ""

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "Error: GitHub CLI (gh) is not installed."
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "Error: Not authenticated with GitHub CLI."
    echo "Run: gh auth login"
    exit 1
fi

echo "Enter your API keys and email address."
echo "These will be stored as GitHub repository secrets."
echo ""

read -sp "Gemini API Key (from aistudio.google.com): " GEMINI_KEY
echo ""

read -sp "Resend API Key (from resend.com/api-keys): " RESEND_KEY
echo ""

read -p "Your email address: " EMAIL

echo ""
echo "Setting GitHub secrets..."

gh secret set GEMINI_API_KEY --body "$GEMINI_KEY"
echo "✓ GEMINI_API_KEY set"

gh secret set RESEND_API_KEY --body "$RESEND_KEY"
echo "✓ RESEND_API_KEY set"

gh secret set EMAIL_TO --body "$EMAIL"
echo "✓ EMAIL_TO set"

echo ""
echo "====================================="
echo "✅ All secrets configured!"
echo ""
echo "Next steps:"
echo "1. Push this repo to GitHub"
echo "2. Go to Actions tab and run 'Daily TLDR Digest' manually"
echo "3. Or wait for the daily 8am UTC run"
echo "====================================="

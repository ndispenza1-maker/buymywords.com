/**
 * Translate raw LLM provider errors into messages a human can actually act on.
 * Grandma shouldn't see "OpenAI error: {"error":{"type":"invalid_request_error"...}}"
 */

type ProviderName = "openai" | "anthropic" | "google" | "grok";

/**
 * Given a provider name and HTTP status code, return a plain-English error.
 */
export function translateProviderError(
  provider: ProviderName,
  status: number,
  rawBody?: string
): string {
  // Auth failures
  if (status === 401) {
    return "Your API key isn't working. Open ⚙️ settings and double-check it.";
  }

  // Permission / billing
  if (status === 403) {
    return "Your API key doesn't have access to this model. Check your provider account — you may need to add billing info or enable the API.";
  }

  // Rate limits
  if (status === 429) {
    return "Your AI provider is rate-limiting you. Wait a minute and try again. If this keeps happening, check your provider's usage limits.";
  }

  // Quota / billing exhausted
  if (status === 402 || (rawBody && /quota|insufficient.*funds|billing/i.test(rawBody))) {
    return "Your API account ran out of credits. Add billing info or credits on your provider's website, then try again.";
  }

  // Model not found
  if (status === 404) {
    return "The AI model isn't available. This usually fixes itself — try again in a minute. If it persists, your provider may have changed their model names.";
  }

  // Request too large
  if (status === 413 || (rawBody && /too.*large|max.*tokens|context.*length/i.test(rawBody))) {
    return "Your conversation got too long for the AI to handle. Try starting a shorter request or clear the chat and start fresh.";
  }

  // Content filter
  if (rawBody && /content.*filter|safety|moderation|refused/i.test(rawBody)) {
    return "Your AI provider's safety filter blocked this request. Try rephrasing what you asked.";
  }

  // Server errors
  if (status >= 500) {
    const providerNames: Record<ProviderName, string> = {
      openai: "OpenAI",
      anthropic: "Anthropic",
      google: "Google AI",
      grok: "xAI/Grok",
    };
    return `${providerNames[provider]} is having server issues right now. Wait a minute and try again.`;
  }

  // Fallback
  return "Something went wrong talking to your AI. Try again — if it keeps failing, check your API key in ⚙️ settings.";
}

/**
 * Validate that an API key looks right for its provider.
 * Returns null if OK, or a human-readable problem description.
 */
export function validateKeyFormat(provider: ProviderName, key: string): string | null {
  const trimmed = key.trim();

  if (!trimmed) {
    return "Please paste your API key.";
  }

  // Catch obvious non-keys (emails, URLs, passwords)
  if (trimmed.includes("@")) {
    return "That looks like an email address, not an API key. Your API key is a long string of letters and numbers from your AI provider's dashboard.";
  }
  if (trimmed.startsWith("http")) {
    return "That looks like a URL, not an API key. Your API key is a long string of letters and numbers — look for it on your provider's API settings page.";
  }
  if (trimmed.length < 10) {
    return "That's too short to be an API key. API keys are usually 30+ characters long.";
  }

  switch (provider) {
    case "openai":
      if (!trimmed.startsWith("sk-")) {
        return "OpenAI API keys start with \"sk-\". Check that you copied the full key from platform.openai.com.";
      }
      break;
    case "anthropic":
      if (!trimmed.startsWith("sk-ant-")) {
        return "Anthropic API keys start with \"sk-ant-\". Check that you copied the full key from console.anthropic.com.";
      }
      break;
    case "google":
      // Google AI Studio keys: legacy format starts with AIza, newer format starts with AQ.
      if (trimmed.startsWith("sk-")) {
        return "That looks like an OpenAI key, not a Google key. Switch the provider dropdown to OpenAI, or get a Google key from aistudio.google.com.";
      }
      if (trimmed.startsWith("xai-")) {
        return "That looks like a Grok key, not a Google key. Switch the provider dropdown to Grok, or get a Google key from aistudio.google.com.";
      }
      if (trimmed.startsWith("sk-ant-")) {
        return "That looks like an Anthropic key, not a Google key. Switch the provider dropdown to Anthropic, or get a Google key from aistudio.google.com.";
      }
      // Accept AIza (legacy) and AQ. (current) prefixes
      if (!trimmed.startsWith("AIza") && !trimmed.startsWith("AQ.")) {
        return "That doesn't look like a Google AI key. Get a free one at aistudio.google.com — click \"Get API Key\" → \"Create API Key\" → copy it.";
      }
      break;
    case "grok":
      if (!trimmed.startsWith("xai-")) {
        return "Grok/xAI API keys start with \"xai-\". Check that you copied the full key from console.x.ai.";
      }
      break;
  }

  // Check for trailing/leading whitespace or newlines in the original (before trim)
  if (key !== trimmed) {
    // We'll trim it server-side, but flag it if it has newlines (common paste artifact)
    if (key.includes("\n") || key.includes("\r")) {
      return null; // Will be trimmed, no problem — just informational
    }
  }

  return null;
}

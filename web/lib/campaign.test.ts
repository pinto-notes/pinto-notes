import { afterEach, describe, expect, it } from "vitest";
import { appleCampaignToken, campaignFrom, campaignProperties, forgetCampaign, heldAppleToken, heldCampaign, holdCampaign, holdOrganicSource, organicSourceFrom, withAppleCampaign, withAppleToken } from "./campaign";
import { APP_STORE_URL } from "./site";

const AD = "?utm_source=chatgpt_ads&utm_medium=paid&utm_campaign=test1&utm_content=folders";

afterEach(() => forgetCampaign());

describe("paid campaigns", () => {
  it("reads a paid ad's tags, lowercased", () => {
    expect(campaignFrom(AD)).toEqual({ source: "chatgpt_ads", medium: "paid", name: "test1", content: "folders" });
    expect(campaignFrom("?utm_source=ChatGPT_Ads&utm_medium=Paid&utm_campaign=Test1")).toEqual({ source: "chatgpt_ads", medium: "paid", name: "test1", content: "" });
  });

  it("ignores links that aren't ads: ChatGPT's own citations, newsletters, nothing at all", () => {
    expect(campaignFrom("?utm_source=chatgpt.com")).toBeNull();
    expect(campaignFrom("?utm_source=newsletter&utm_medium=email&utm_campaign=nov")).toBeNull();
    expect(campaignFrom("")).toBeNull();
    expect(campaignFrom(undefined)).toBeNull();
  });

  it("drops a campaign with a missing or malformed value instead of sending it on", () => {
    expect(campaignFrom("?utm_medium=paid&utm_campaign=test1")).toBeNull();
    expect(campaignFrom("?utm_source=chatgpt_ads&utm_medium=paid")).toBeNull();
    expect(campaignFrom("?utm_source=chatgpt_ads&utm_medium=paid&utm_campaign=<script>")).toBeNull();
    expect(campaignFrom("?utm_source=chatgpt_ads&utm_medium=paid&utm_campaign=test1&utm_content=a%20b")).toBeNull();
    expect(campaignFrom(`?utm_source=chatgpt_ads&utm_medium=paid&utm_campaign=${"x".repeat(41)}`)).toBeNull();
  });

  it("names the campaign on events, and adds nothing without one", () => {
    expect(campaignProperties(campaignFrom(AD))).toEqual({ campaign_source: "chatgpt_ads", campaign_medium: "paid", campaign_name: "test1", campaign_content: "folders" });
    expect(campaignProperties(campaignFrom("?utm_source=x&utm_medium=paid&utm_campaign=y"))).not.toHaveProperty("campaign_content");
    expect(campaignProperties(null)).toEqual({});
  });

  it("keeps Apple's campaign token within 40 characters", () => {
    expect(appleCampaignToken(campaignFrom(AD)!)).toBe("chatgpt_ads-test1-folders");
    const long = campaignFrom(`?utm_source=chatgpt_ads&utm_medium=paid&utm_campaign=${"c".repeat(30)}&utm_content=v2`)!;
    expect(appleCampaignToken(long)).toHaveLength(40);
  });

  it("adds Apple's campaign parameters to App Store links, iPhone and Mac", () => {
    const c = campaignFrom(AD);
    const iphone = new URL(withAppleCampaign(APP_STORE_URL, c, "123456")!);
    expect(iphone.origin + iphone.pathname).toBe(APP_STORE_URL);
    expect(Object.fromEntries(iphone.searchParams)).toEqual({ pt: "123456", ct: "chatgpt_ads-test1-folders", mt: "8" });
    const mac = new URL(withAppleCampaign(`${APP_STORE_URL}?platform=mac`, c, "123456")!);
    expect(Object.fromEntries(mac.searchParams)).toEqual({ platform: "mac", pt: "123456", ct: "chatgpt_ads-test1-folders", mt: "12" });
  });

  it("leaves links alone without a campaign, without a provider token, or off the App Store", () => {
    const c = campaignFrom(AD);
    expect(withAppleCampaign(APP_STORE_URL, null, "123456")).toBeNull();
    expect(withAppleCampaign(APP_STORE_URL, c, "")).toBeNull();
    expect(withAppleCampaign("https://pintonotes.com/download/mac", c, "123456")).toBeNull();
    expect(withAppleCampaign("http://apps.apple.com/app/id1", c, "123456")).toBeNull();
    expect(withAppleCampaign("/download", c, "123456")).toBeNull();
  });

  it("uses Pinto's provider token from App Store Connect by default", () => {
    expect(new URL(withAppleCampaign(APP_STORE_URL, campaignFrom(AD))!).searchParams.get("pt")).toBe("129528541");
  });

  it("holds the campaign for the rest of the visit, until another ad replaces it", () => {
    expect(heldCampaign()).toBeNull();
    holdCampaign(AD);
    holdCampaign("");
    holdCampaign("?utm_source=chatgpt.com");
    expect(heldCampaign()?.name).toBe("test1");
    holdCampaign("?utm_source=chatgpt_ads&utm_medium=paid&utm_campaign=test2");
    expect(heldCampaign()?.name).toBe("test2");
  });
});

describe("organic sources", () => {
  const SITE = "pintonotes.com";
  const POST = "/blog/apple-notes-budget-template";
  const from = (referrer: string, search = "", path = "/download") => organicSourceFrom(search, referrer, path, SITE);
  // Apple's ct characters, at most 40.
  const APPLE_CT = /^[A-Za-z0-9._-]{1,40}$/;

  it("names ChatGPT by its utm_source or its referrer", () => {
    expect(from("", "?utm_source=chatgpt.com")).toBe("org-chatgpt");
    expect(from("https://chatgpt.com/")).toBe("org-chatgpt");
    expect(from("https://chat.openai.com/c/abc")).toBe("org-chatgpt");
    expect(from("https://www.google.com/", "?utm_source=chatgpt.com")).toBe("org-chatgpt");
  });

  it("names the other AI apps by their referrers", () => {
    expect(from("https://www.perplexity.ai/")).toBe("org-perplexity");
    expect(from("https://claude.ai/")).toBe("org-claude");
    expect(from("https://gemini.google.com/")).toBe("org-gemini");
    expect(from("https://copilot.microsoft.com/")).toBe("org-copilot");
  });

  it("names the search engines by their referrers", () => {
    expect(from("https://www.google.com/")).toBe("org-google");
    expect(from("https://www.google.co.uk/")).toBe("org-google");
    expect(from("https://www.google.se/")).toBe("org-google");
    expect(from("https://www.bing.com/")).toBe("org-bing");
    expect(from("https://duckduckgo.com/")).toBe("org-ddg");
  });

  it("calls any other outside site a referral, and no referrer and no utm direct", () => {
    expect(from("https://news.ycombinator.com/item?id=1")).toBe("org-ref");
    expect(from("https://mail.google.com/")).toBe("org-ref");
    expect(from("", "?utm_source=newsletter&utm_medium=email")).toBe("org-ref");
    expect(from("")).toBe("org-direct");
    expect(organicSourceFrom(undefined, undefined, "/download", SITE)).toBe("org-direct");
  });

  it("adds where the visit started: a blog post, a template page or the home page", () => {
    expect(from("https://chatgpt.com/", "", POST)).toBe("org-chatgpt-blog");
    expect(from("https://www.google.com/", "", "/de/blog/buecherliste-apple-notizen")).toBe("org-google-blog");
    expect(from("https://www.google.com/", "", "/templates/habit-tracker")).toBe("org-google-tpl");
    expect(from("https://www.google.com/", "", "/templates")).toBe("org-google-tpl");
    expect(from("", "", "/")).toBe("org-direct-home");
    expect(from("https://www.perplexity.ai/", "", "/help")).toBe("org-perplexity");
  });

  it("can't tell a source from a page this site linked to", () => {
    expect(from("https://pintonotes.com/blog", "", "/download")).toBeNull();
    expect(from("https://www.pintonotes.com/", "", "/download")).toBeNull();
  });

  it("keeps every organic token within 40 of Apple's characters", () => {
    const referrers = ["", "https://chatgpt.com/", "https://www.perplexity.ai/", "https://claude.ai/", "https://gemini.google.com/", "https://copilot.microsoft.com/", "https://www.google.com/", "https://www.bing.com/", "https://duckduckgo.com/", "https://example.org/"];
    for (const referrer of referrers) {
      for (const path of ["/", POST, "/templates/x", "/download"]) {
        expect(from(referrer, "", path)).toMatch(APPLE_CT);
      }
    }
    const tagged = new URL(withAppleToken("https://apps.apple.com/app/id1", "x".repeat(50), "123456")!);
    expect(tagged.searchParams.get("ct")).toHaveLength(40);
  });

  it("lets only the visit's first page decide the source", () => {
    expect(holdOrganicSource("", "https://chatgpt.com/", POST, SITE)).toBe("org-chatgpt-blog");
    expect(holdOrganicSource("", "", "/download", SITE)).toBe("org-chatgpt-blog");
    expect(holdOrganicSource("", "https://www.google.com/", "/", SITE)).toBe("org-chatgpt-blog");
    expect(heldAppleToken()).toBe("org-chatgpt-blog");
  });

  it("tags App Store links with the organic source when there is no ad", () => {
    holdOrganicSource("", "https://www.google.com/", "/templates/habit-tracker", SITE);
    const url = new URL(withAppleToken(APP_STORE_URL, heldAppleToken(), "123456")!);
    expect(Object.fromEntries(url.searchParams)).toEqual({ pt: "123456", ct: "org-google-tpl", mt: "8" });
  });

  it("lets a paid campaign win, with the same token as before", () => {
    holdOrganicSource("", "https://chatgpt.com/", POST, SITE);
    holdCampaign(AD);
    expect(heldAppleToken()).toBe("chatgpt_ads-test1-folders");
    expect(withAppleToken(APP_STORE_URL, heldAppleToken(), "123456")).toBe(withAppleCampaign(APP_STORE_URL, heldCampaign(), "123456"));
    forgetCampaign();
    holdCampaign(AD);
    holdOrganicSource(AD, "https://chatgpt.com/", POST, SITE);
    expect(heldAppleToken()).toBe("chatgpt_ads-test1-folders");
  });

  it("holds nothing until a page has been seen", () => {
    expect(heldAppleToken()).toBeNull();
    expect(withAppleToken(APP_STORE_URL, heldAppleToken(), "123456")).toBeNull();
  });
});

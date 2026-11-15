import { afterEach, describe, expect, it } from "vitest";
import { appleCampaignToken, campaignFrom, campaignProperties, forgetCampaign, heldCampaign, holdCampaign, withAppleCampaign } from "./campaign";
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

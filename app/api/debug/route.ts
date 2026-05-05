import { NextResponse } from "next/server";
import { hasGNewsConfig } from "@/lib/news/gnewsClient";
import { hasDeepSeekConfig } from "@/lib/ai/deepseekClient";

export async function GET() {
  return NextResponse.json({
    gnews: {
      hasKey: hasGNewsConfig(),
      keyLength: (process.env.GNEWS_API_KEY || "").length,
    },
    deepseek: {
      hasKey: hasDeepSeekConfig(),
      keyLength: (process.env.DEEPSEEK_API_KEY || "").length,
      baseUrl: process.env.DEEPSEEK_BASE_URL || "",
      model: process.env.DEEPSEEK_MODEL || "",
    },
    newsProvider: process.env.NEWS_PROVIDER || "",
  });
}

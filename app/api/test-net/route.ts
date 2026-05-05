import { NextResponse } from "next/server";

export async function GET() {
  const results: Record<string, string> = {};

  // Test 1: google.com
  try {
    const res = await fetch("https://www.google.com", { signal: AbortSignal.timeout(3000) });
    results.google = `status ${res.status}`;
  } catch (e) {
    results.google = `fail: ${(e as Error).message}`;
  }

  // Test 2: gnews.io
  try {
    const token = process.env.GNEWS_API_KEY;
    if (!token) throw new Error("no key");
    const res = await fetch(
      `https://gnews.io/api/v4/search?q=AI&lang=en&max=1&apikey=${token}`,
      { signal: AbortSignal.timeout(5000) }
    );
    results.gnews = `status ${res.status}`;
  } catch (e) {
    results.gnews = `fail: ${(e as Error).message}`;
  }

  // Test 3: deepseek api
  try {
    const key = process.env.DEEPSEEK_API_KEY;
    if (!key) throw new Error("no key");
    const res = await fetch("https://api.deepseek.com/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(3000),
    });
    results.deepseek = `status ${res.status}`;
  } catch (e) {
    results.deepseek = `fail: ${(e as Error).message}`;
  }

  return NextResponse.json(results);
}

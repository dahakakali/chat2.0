import { NextResponse } from "next/server";

const GIPHY_KEY = process.env.GIPHY_API_KEY;
const BASE = "https://api.giphy.com/v1/stickers";

export async function GET(req) {
  if (!GIPHY_KEY) {
    return NextResponse.json({ error: "GIPHY API key not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  const limit = searchParams.get("limit") || "24";
  const offset = searchParams.get("offset") || "0";

  const endpoint = query
    ? `${BASE}/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&rating=g`
    : `${BASE}/trending?api_key=${GIPHY_KEY}&limit=${limit}&offset=${offset}&rating=g`;

  try {
    const res = await fetch(endpoint, { next: { revalidate: 300 } });
    const json = await res.json();

    const stickers = (json.data || []).map((g) => ({
      id: g.id,
      url: g.images.original.url,
      preview: g.images.fixed_width_small.url,
      width: Number(g.images.fixed_width_small.width),
      height: Number(g.images.fixed_width_small.height),
    }));

    return NextResponse.json({ stickers });
  } catch (e) {
    console.error("GIPHY fetch error:", e);
    return NextResponse.json({ error: "Failed to fetch stickers" }, { status: 502 });
  }
}

import { NextResponse } from "next/server";

/** Geocoding via Nominatim (OpenStreetMap) - gratuito, no API key */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  if (!q?.trim()) {
    return NextResponse.json({ error: "Parametro q richiesto" }, { status: 400 });
  }
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q.trim() + ", Italy")}&limit=1`,
      { headers: { "User-Agent": "TourneyHub/1.0" } }
    );
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ latitude: null, longitude: null });
    }
    const { lat, lon } = data[0];
    return NextResponse.json({
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
    });
  } catch (err) {
    console.error("Geocode error:", err);
    return NextResponse.json({ error: "Geocoding fallito" }, { status: 500 });
  }
}

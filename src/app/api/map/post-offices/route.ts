import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 1000;
const COLUMNS = [
  "id",
  "name",
  "prefecture",
  "municipality",
  "county",
  "is_collected",
  "collected_date",
  "collector_name",
  "memo",
  "instruction",
  "latitude",
  "longitude",
].join(",");

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: "Map database connection is not configured." },
      { status: 503 },
    );
  }

  try {
    const records: unknown[] = [];

    for (let offset = 0; ; offset += PAGE_SIZE) {
      const url = new URL("/rest/v1/post_offices", supabaseUrl);
      url.searchParams.set("select", COLUMNS);

      const response = await fetch(url, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Range: `${offset}-${offset + PAGE_SIZE - 1}`,
          "Range-Unit": "items",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        console.error("Map database query failed:", response.status, await response.text());
        return NextResponse.json(
          { error: "Could not load map data from the database." },
          { status: 502 },
        );
      }

      const page: unknown = await response.json();
      if (!Array.isArray(page)) {
        return NextResponse.json(
          { error: "The map database returned an unexpected response." },
          { status: 502 },
        );
      }

      records.push(...page);
      if (page.length < PAGE_SIZE) break;
    }

    return NextResponse.json(records, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Map data endpoint failed:", error);
    return NextResponse.json(
      { error: "Could not load map data from the database." },
      { status: 500 },
    );
  }
}

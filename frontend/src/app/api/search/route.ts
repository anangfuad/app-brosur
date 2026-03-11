import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || query.trim() === "") {
      return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
    }

    // Header untuk UTF-8 (teks Arab)
    const headers = {
      "Content-Type": "application/json; charset=utf-8",
    };

    // Format query untuk PostgreSQL tsquery ('puasa & ramadhan')
    const tsQuery = query.trim().split(/\s+/).join(' & ');

    // Query khusus Vercel Postgres dengan Full-Text Search
    const results = await prisma.$queryRaw`
      SELECT id, judul, isi_indo, teks_arab, html_path 
      FROM "Dalil" 
      WHERE search_vector @@ to_tsquery('indonesian', ${tsQuery})
      LIMIT 50;
    `;

    return NextResponse.json({ data: results }, { status: 200, headers });
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { fetchTaf } from "@/lib/weather/client";

export async function GET(req: NextRequest) {
  const icao = req.nextUrl.searchParams.get("icao")?.toUpperCase();

  if (!icao) {
    return NextResponse.json(
      { data: null, error: "Parâmetro 'icao' é obrigatório", timestamp: new Date().toISOString() },
      { status: 400 }
    );
  }

  try {
    const data = await fetchTaf(icao);
    return NextResponse.json({
      data,
      error: null,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: "Falha ao buscar TAF", timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}

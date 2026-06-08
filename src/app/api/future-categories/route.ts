import { NextRequest, NextResponse } from "next/server";
const CHECKWX_BASE = "https://api.checkwx.com";

export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const icaos = searchParams.get("icaos");
  const hourOffset = parseInt(searchParams.get("hourOffset") || "0", 10);

  if (!icaos) {
    return NextResponse.json({ error: "Missing icaos" }, { status: 400 });
  }

  if (hourOffset <= 0) {
    return NextResponse.json({ error: "Use /api/flight-categories for offset 0" }, { status: 400 });
  }

  const apiKey = process.env.CHECKWX_API_KEY;
  if (!apiKey || apiKey === "your_checkwx_api_key_here") {
    return NextResponse.json({ data: {} });
  }

  try {
    const res = await fetch(`${CHECKWX_BASE}/taf/${icaos}/decoded`, {
      headers: { "X-API-Key": apiKey },
      next: { revalidate: 60 * 5 },
    });

    if (!res.ok) throw new Error(`CheckWX HTTP ${res.status}`);
    const json = await res.json();

    const tafList: any[] = json.data || [];
    const categories: Record<string, string> = {};

    const now = new Date();
    const targetTime = new Date(now.getTime() + hourOffset * 3600 * 1000);

    for (const taf of tafList) {
      if (!taf.icao || !taf.forecast) continue;

      let visMeters: number | undefined = undefined;
      let ceilFeet: number | undefined = undefined;

      for (const block of taf.forecast) {
        const changeType: string | undefined = block.change?.type;

        if (changeType === "TEMPO" || changeType?.startsWith("PROB")) continue;

        const fromStr = block.change?.period?.from;
        if (!fromStr) continue;

        const blockTime = new Date(fromStr);
        if (blockTime > targetTime) continue;

        if (block.visibility?.meters !== undefined) {
          visMeters = block.visibility.meters;
        }

        if (block.clouds !== undefined) {
          const ceiling = block.clouds
            .filter((c: any) => c.code === "BKN" || c.code === "OVC")
            .sort((a: any, b: any) => a.feet - b.feet)[0];
          ceilFeet = ceiling ? ceiling.feet : undefined;
        }
      }

      for (const block of taf.forecast) {
        if (block.change?.type !== "TEMPO") continue;

        const fromStr = block.change?.period?.from;
        const toStr = block.change?.period?.to;
        if (!fromStr || !toStr) continue;

        const blockFrom = new Date(fromStr);
        const blockTo = new Date(toStr);

        if (targetTime < blockFrom || targetTime >= blockTo) continue;

        if (block.visibility?.meters !== undefined) {
          visMeters = visMeters === undefined
            ? block.visibility.meters
            : Math.min(visMeters, block.visibility.meters);
        }
        if (block.clouds !== undefined) {
          const ceiling = block.clouds
            .filter((c: any) => c.code === "BKN" || c.code === "OVC")
            .sort((a: any, b: any) => a.feet - b.feet)[0];
          if (ceiling) {
            ceilFeet = ceilFeet === undefined
              ? ceiling.feet
              : Math.min(ceilFeet, ceiling.feet);
          }
        }
      }

      let category = "VFR";
      if (visMeters !== undefined || ceilFeet !== undefined) {
        const v = visMeters ?? Infinity;
        const c = ceilFeet ?? Infinity;
        if (v < 1600 || c < 500) category = "LIFR";
        else if (v < 5000 || c < 1000) category = "IFR";
        else if (v < 8000 || c < 3000) category = "MVFR";
      }

      categories[taf.icao] = category;
    }

    return NextResponse.json({ data: categories });

  } catch (err: any) {
    console.error("[future-categories] Erro:", err.message);
    return NextResponse.json({ error: "Failed to fetch future categories" }, { status: 500 });
  }
}

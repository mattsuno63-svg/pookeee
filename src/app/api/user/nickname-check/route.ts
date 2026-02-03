import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const nickname = searchParams.get("nickname")?.trim();
  const exclude = searchParams.get("exclude"); // userId da escludere (modifica profilo)

  if (!nickname || nickname.length < 2) {
    return NextResponse.json({ available: false, error: "Nickname troppo corto" });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("check_nickname_available", {
      p_nickname: nickname,
      p_exclude_user_id: exclude || null,
    });

    if (error) {
      console.error("check_nickname_available:", error);
      return NextResponse.json({ available: false, error: "Errore verifica" }, { status: 500 });
    }

    return NextResponse.json({ available: data === true });
  } catch {
    return NextResponse.json({ available: false, error: "Errore" }, { status: 500 });
  }
}

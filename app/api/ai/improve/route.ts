import { NextResponse }        from "next/server";
import { createClient }        from "@/lib/supabase/server";
import { improveText }         from "@/lib/ai/services/improve";
import { checkAILimits }       from "@/lib/ai/usage";
import type { ImprovementAction } from "@/lib/ai/types";

const VALID_ACTIONS: ImprovementAction[] = ["improve", "shorten", "expand", "formalize", "simplify", "translate"];

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("org_id").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const { data: org } = await supabase
    .from("organizations").select("plan").eq("id", profile.org_id).single();
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const { allowed } = await checkAILimits(profile.org_id, org.plan);
  if (!allowed) {
    return NextResponse.json({ error: "Monthly AI usage limit reached." }, { status: 429 });
  }

  const body = await request.json();
  const { text, action } = body as { text: string; action?: string };

  if (!text?.trim()) return NextResponse.json({ error: "text is required" }, { status: 400 });
  if (text.length > 5000) return NextResponse.json({ error: "Text too long (max 5000 chars)" }, { status: 400 });

  const resolvedAction: ImprovementAction = VALID_ACTIONS.includes(action as ImprovementAction)
    ? (action as ImprovementAction)
    : "improve";

  try {
    const improved = await improveText(text, resolvedAction, profile.org_id, user.id);
    return NextResponse.json({ text: improved });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI request failed" },
      { status: 500 }
    );
  }
}

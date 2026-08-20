import { NextResponse }        from "next/server";
import { getCurrentUser }      from "@/lib/auth/helpers";
import { improveText }         from "@/lib/ai/services/improve";
import { checkAIAccess }       from "@/lib/ai/usage";
import type { ImprovementAction } from "@/lib/ai/types";

const VALID_ACTIONS: ImprovementAction[] = ["improve", "shorten", "expand", "formalize", "simplify", "translate"];

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { resolveEffectivePlan } = await import("@/lib/plans");
  const effectivePlan = resolveEffectivePlan({
    plan: user.organization.plan,
    freepass_plan: user.organization.freepassPlan,
    freepass_until: user.organization.freepassUntil?.toISOString() ?? null,
  });

  const { allowed, reason } = await checkAIAccess(user.profile.organizationId, effectivePlan, "ai_improve");
  if (!allowed) {
    return NextResponse.json({ error: reason }, { status: 429 });
  }

  const body = await request.json();
  const { text, action } = body as { text: string; action?: string };

  if (!text?.trim()) return NextResponse.json({ error: "text is required" }, { status: 400 });
  if (text.length > 5000) return NextResponse.json({ error: "Text too long (max 5000 chars)" }, { status: 400 });

  const resolvedAction: ImprovementAction = VALID_ACTIONS.includes(action as ImprovementAction)
    ? (action as ImprovementAction)
    : "improve";

  try {
    const improved = await improveText(text, resolvedAction, user.profile.organizationId, user.id);
    return NextResponse.json({ text: improved });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI request failed" },
      { status: 500 }
    );
  }
}

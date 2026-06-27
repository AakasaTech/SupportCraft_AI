import { render } from "@react-email/components";
import { createElement } from "react";
import { renderVariables, buildDefaultVariables } from "./variables";
import type { TemplateVariables } from "../types";

// Lazy imports so Next.js doesn't bundle all templates everywhere
async function loadTemplate(slug: string) {
  switch (slug) {
    case "ticket-created":
      return (await import("@/emails/TicketCreatedEmail")).TicketCreatedEmail;
    case "agent-reply":
      return (await import("@/emails/AgentReplyEmail")).AgentReplyEmail;
    case "ticket-closed":
      return (await import("@/emails/TicketClosedEmail")).TicketClosedEmail;
    case "welcome":
      return (await import("@/emails/WelcomeEmail")).WelcomeEmail;
    case "invite":
      return (await import("@/emails/InviteEmail")).InviteEmail;
    case "auto-reply":
      return (await import("@/emails/AutoReplyEmail")).AutoReplyEmail;
    default:
      return null;
  }
}

export interface RenderedTemplate {
  html:  string;
  plain: string;
}

export async function renderTemplate(
  slug: string,
  vars: TemplateVariables
): Promise<RenderedTemplate | null> {
  const Component = await loadTemplate(slug);
  if (!Component) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html  = await render(createElement(Component as any, vars));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plain = await render(createElement(Component as any, vars), { plainText: true });

  return { html, plain };
}

export async function renderCustomTemplate(params: {
  subjectTemplate: string;
  bodyTemplate:    string;
  vars:            TemplateVariables;
}): Promise<{ subject: string; body: string }> {
  return {
    subject: renderVariables(params.subjectTemplate, params.vars),
    body:    renderVariables(params.bodyTemplate,    params.vars),
  };
}

export { buildDefaultVariables, renderVariables };

import type { TemplateVariables } from "../types";

/** Replace {{variable}} placeholders in a template string. */
export function renderVariables(template: string, vars: TemplateVariables): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

export function buildDefaultVariables(params: {
  customerName?:      string;
  ticketNumber?:      string;
  ticketSubject?:     string;
  agentName?:         string;
  organizationName?:  string;
  supportEmail?:      string;
  portalUrl?:         string;
  knowledgeBaseUrl?:  string;
}): TemplateVariables {
  return {
    customer_name:       params.customerName      ?? "",
    ticket_number:       params.ticketNumber      ?? "",
    ticket_subject:      params.ticketSubject     ?? "",
    agent_name:          params.agentName         ?? "Support Team",
    organization_name:   params.organizationName  ?? "SupportCraft",
    support_email:       params.supportEmail      ?? "",
    portal_url:          params.portalUrl         ?? process.env.NEXT_PUBLIC_APP_URL ?? "",
    knowledge_base_url:  params.knowledgeBaseUrl  ?? `${process.env.NEXT_PUBLIC_APP_URL}/portal/knowledge-base`,
    current_year:        new Date().getFullYear().toString(),
  };
}

import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Link, Preview, Section, Text, Tailwind,
} from "@react-email/components";

interface Props {
  customer_name?:     string;
  ticket_number?:     string;
  ticket_subject?:    string;
  agent_name?:        string;
  organization_name?: string;
  reply_body?:        string;
  portal_url?:        string;
  support_email?:     string;
  current_year?:      string;
}

export function AgentReplyEmail({
  customer_name     = "Customer",
  ticket_number     = "",
  ticket_subject    = "",
  agent_name        = "Support Team",
  organization_name = "SupportCraft",
  reply_body        = "",
  portal_url        = "",
  support_email     = "",
  current_year      = new Date().getFullYear().toString(),
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>{agent_name} replied to your ticket #{ticket_number}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto py-10 px-4 max-w-xl">
            <Section className="bg-white rounded-2xl shadow-sm px-8 py-8">
              <Text className="text-xs uppercase tracking-wide text-indigo-600 font-semibold m-0">
                {organization_name}
              </Text>
              <Heading className="text-2xl font-bold text-gray-900 mb-1 mt-2">
                New reply to your ticket
              </Heading>
              <Text className="text-gray-600 mt-0 mb-1">
                Hi {customer_name}, {agent_name} has responded to ticket #{ticket_number}:
              </Text>
              <Text className="text-sm text-gray-500 mb-6 mt-0">{ticket_subject}</Text>

              <Section className="bg-gray-50 rounded-xl p-5 mb-6 border-l-4 border-indigo-500">
                <Text className="text-gray-800 whitespace-pre-wrap m-0">{reply_body}</Text>
              </Section>

              <Text className="text-xs text-gray-500 mb-4">
                — {agent_name}, {organization_name} Support
              </Text>

              {portal_url && (
                <Button
                  href={`${portal_url}/portal/tickets`}
                  className="bg-indigo-600 text-white rounded-xl px-6 py-3 font-semibold text-sm"
                >
                  View full conversation
                </Button>
              )}

              <Hr className="border-gray-200 my-8" />
              <Text className="text-xs text-gray-400 m-0">
                Reply directly to this email to continue the conversation.
                {support_email && <> Or email us at <Link href={`mailto:${support_email}`}>{support_email}</Link>.</>}
              </Text>
            </Section>
            <Text className="text-center text-xs text-gray-400 mt-6">
              © {current_year} {organization_name}
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default AgentReplyEmail;

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
  portal_url?:        string;
  knowledge_base_url?: string;
  support_email?:     string;
  current_year?:      string;
}

export function TicketClosedEmail({
  customer_name      = "Customer",
  ticket_number      = "",
  ticket_subject     = "",
  agent_name         = "Support Team",
  organization_name  = "SupportCraft",
  portal_url         = "",
  knowledge_base_url = "",
  support_email      = "",
  current_year       = new Date().getFullYear().toString(),
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Your ticket #{ticket_number} has been resolved</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto py-10 px-4 max-w-xl">
            <Section className="bg-white rounded-2xl shadow-sm px-8 py-8">
              <Heading className="text-2xl font-bold text-gray-900 mb-1">
                Ticket resolved ✓
              </Heading>
              <Text className="text-gray-600 mt-0 mb-6">
                Hi {customer_name}, we&apos;ve marked your ticket #{ticket_number} as resolved.
              </Text>

              <Section className="bg-gray-50 rounded-xl p-4 mb-6">
                <Text className="text-gray-700 m-0">{ticket_subject}</Text>
              </Section>

              <Text className="text-gray-600 mb-6">
                If your issue is still not resolved, please reply to this email or open a new support request.
              </Text>

              <Section className="flex gap-3">
                {portal_url && (
                  <Button
                    href={`${portal_url}/portal/tickets/new`}
                    className="bg-indigo-600 text-white rounded-xl px-5 py-2.5 font-semibold text-sm mr-3"
                  >
                    Open new ticket
                  </Button>
                )}
                {knowledge_base_url && (
                  <Button
                    href={knowledge_base_url}
                    className="bg-white border border-gray-200 text-gray-700 rounded-xl px-5 py-2.5 font-semibold text-sm"
                  >
                    Knowledge Base
                  </Button>
                )}
              </Section>

              <Hr className="border-gray-200 my-8" />
              <Text className="text-xs text-gray-400 m-0">
                Closed by {agent_name}.
                {support_email && <> Questions? <Link href={`mailto:${support_email}`}>{support_email}</Link></>}
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

export default TicketClosedEmail;

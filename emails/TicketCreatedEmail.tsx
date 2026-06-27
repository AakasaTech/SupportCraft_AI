import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Link, Preview, Section, Text, Tailwind,
} from "@react-email/components";

interface Props {
  customer_name?:      string;
  ticket_number?:      string;
  ticket_subject?:     string;
  organization_name?:  string;
  support_email?:      string;
  portal_url?:         string;
  current_year?:       string;
}

export function TicketCreatedEmail({
  customer_name      = "Customer",
  ticket_number      = "",
  ticket_subject     = "",
  organization_name  = "SupportCraft",
  support_email      = "",
  portal_url         = "",
  current_year       = new Date().getFullYear().toString(),
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Your support request #{ticket_number} has been received</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto py-10 px-4 max-w-xl">
            <Section className="bg-white rounded-2xl shadow-sm px-8 py-8">
              <Heading className="text-2xl font-bold text-gray-900 mb-1">
                We received your request
              </Heading>
              <Text className="text-gray-600 mt-0 mb-6">
                Hi {customer_name}, thanks for reaching out to {organization_name}.
                We&apos;ve created a support ticket and our team will be in touch soon.
              </Text>

              <Section className="bg-gray-50 rounded-xl p-4 mb-6">
                <Text className="text-xs uppercase tracking-wide text-gray-500 font-semibold m-0">Ticket</Text>
                <Text className="text-gray-900 font-semibold m-0 mt-1">#{ticket_number}</Text>
                <Text className="text-gray-700 m-0 mt-1">{ticket_subject}</Text>
              </Section>

              {portal_url && (
                <Button
                  href={`${portal_url}/portal/tickets`}
                  className="bg-indigo-600 text-white rounded-xl px-6 py-3 font-semibold text-sm"
                >
                  View your ticket
                </Button>
              )}

              <Hr className="border-gray-200 my-8" />
              <Text className="text-xs text-gray-400 m-0">
                Reply to this email to add more information to your ticket.
                {support_email && <> You can also email us at <Link href={`mailto:${support_email}`}>{support_email}</Link>.</>}
              </Text>
            </Section>

            <Text className="text-center text-xs text-gray-400 mt-6">
              © {current_year} {organization_name}. All rights reserved.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default TicketCreatedEmail;

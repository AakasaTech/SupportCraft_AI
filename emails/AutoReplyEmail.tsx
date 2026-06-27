import {
  Body, Container, Head, Heading, Html,
  Preview, Section, Text, Tailwind, Hr, Link,
} from "@react-email/components";

interface Props {
  customer_name?:     string;
  ticket_number?:     string;
  ticket_subject?:    string;
  organization_name?: string;
  auto_reply_body?:   string;
  support_email?:     string;
  current_year?:      string;
}

export function AutoReplyEmail({
  customer_name      = "Customer",
  ticket_number      = "",
  ticket_subject     = "",
  organization_name  = "SupportCraft",
  auto_reply_body    = "Thank you for contacting us. We will get back to you as soon as possible.",
  support_email      = "",
  current_year       = new Date().getFullYear().toString(),
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>We received your message — ticket #{ticket_number}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto py-10 px-4 max-w-xl">
            <Section className="bg-white rounded-2xl shadow-sm px-8 py-8">
              <Heading className="text-xl font-bold text-gray-900 mb-1">
                {organization_name} Support
              </Heading>
              <Text className="text-gray-600 mt-0 mb-4">Hi {customer_name},</Text>
              <Text className="text-gray-700 whitespace-pre-wrap mb-6">{auto_reply_body}</Text>

              {ticket_number && (
                <Section className="bg-gray-50 rounded-xl p-4 mb-4">
                  <Text className="text-xs text-gray-500 m-0">Your ticket</Text>
                  <Text className="font-semibold text-gray-900 m-0 mt-0.5">#{ticket_number} — {ticket_subject}</Text>
                </Section>
              )}

              <Hr className="border-gray-200 my-6" />
              <Text className="text-xs text-gray-400 m-0">
                This is an automated reply. Please do not reply to this message.
                {support_email && <> For urgent matters: <Link href={`mailto:${support_email}`}>{support_email}</Link></>}
              </Text>
              <Text className="text-xs text-gray-400 mt-4 m-0">
                © {current_year} {organization_name}
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default AutoReplyEmail;

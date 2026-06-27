import {
  Body, Button, Container, Head, Heading, Html,
  Preview, Section, Text, Tailwind, Hr, Link,
} from "@react-email/components";

interface Props {
  customer_name?:     string;
  organization_name?: string;
  portal_url?:        string;
  knowledge_base_url?: string;
  current_year?:      string;
}

export function WelcomeEmail({
  customer_name      = "Customer",
  organization_name  = "SupportCraft",
  portal_url         = "",
  knowledge_base_url = "",
  current_year       = new Date().getFullYear().toString(),
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to {organization_name} Support</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto py-10 px-4 max-w-xl">
            <Section className="bg-white rounded-2xl shadow-sm px-8 py-8">
              <Heading className="text-2xl font-bold text-gray-900 mb-1">
                Welcome, {customer_name}!
              </Heading>
              <Text className="text-gray-600 mt-0 mb-6">
                Your support portal account is ready. You can track your tickets,
                browse the knowledge base, and get help anytime.
              </Text>

              <Section className="flex gap-3 mb-6">
                {portal_url && (
                  <Button
                    href={`${portal_url}/portal/dashboard`}
                    className="bg-indigo-600 text-white rounded-xl px-6 py-3 font-semibold text-sm mr-3"
                  >
                    Go to portal
                  </Button>
                )}
                {knowledge_base_url && (
                  <Button
                    href={knowledge_base_url}
                    className="bg-white border border-gray-200 text-gray-700 rounded-xl px-5 py-2.5 font-semibold text-sm"
                  >
                    Browse Help Articles
                  </Button>
                )}
              </Section>

              <Hr className="border-gray-200 my-6" />
              <Text className="text-xs text-gray-400 m-0">
                © {current_year} {organization_name}
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default WelcomeEmail;

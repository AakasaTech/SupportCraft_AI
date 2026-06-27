import {
  Body, Button, Container, Head, Heading, Html,
  Preview, Section, Text, Tailwind, Hr,
} from "@react-email/components";

interface Props {
  agent_name?:        string;
  organization_name?: string;
  invite_url?:        string;
  role?:              string;
  current_year?:      string;
}

export function InviteEmail({
  agent_name        = "Team Member",
  organization_name = "SupportCraft",
  invite_url        = "",
  role              = "agent",
  current_year      = new Date().getFullYear().toString(),
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>You&apos;ve been invited to join {organization_name} on SupportCraft</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto py-10 px-4 max-w-xl">
            <Section className="bg-white rounded-2xl shadow-sm px-8 py-8">
              <Heading className="text-2xl font-bold text-gray-900 mb-1">
                Team invitation
              </Heading>
              <Text className="text-gray-600 mt-0 mb-6">
                Hi {agent_name}, you&apos;ve been invited to join{" "}
                <strong>{organization_name}</strong> on SupportCraft as a{" "}
                <strong>{role}</strong>.
              </Text>

              {invite_url && (
                <Button
                  href={invite_url}
                  className="bg-indigo-600 text-white rounded-xl px-6 py-3 font-semibold text-sm"
                >
                  Accept invitation
                </Button>
              )}

              <Text className="text-xs text-gray-500 mt-6">
                This invitation expires in 7 days. If you didn&apos;t expect this, you can ignore this email.
              </Text>

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

export default InviteEmail;

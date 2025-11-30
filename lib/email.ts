export type EmailPayload = { to: string | string[]; subject: string; body: string };

export async function sendTaskReminderEmail(payload: EmailPayload) {
  // TODO: Integrate with Resend, SendGrid or other provider.
  console.log('Sending email', payload);
}

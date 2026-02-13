import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;
const hugoPhone = process.env.HUGO_PHONE_NUMBER;

let client: twilio.Twilio | null = null;

function getClient() {
  if (!client && accountSid && authToken) {
    client = twilio(accountSid, authToken);
  }
  return client;
}

export async function sendOrderNotification(itemCount: number, orderNotes?: string) {
  const smsClient = getClient();
  if (!smsClient || !fromPhone || !hugoPhone) {
    console.log("SMS not configured. Would send:", `New order from Yuge! ${itemCount} dish(es) — check YuGo Eats 🍜`);
    return;
  }

  let body = `🍜 New order from Yuge! ${itemCount} dish(es) — check YuGo Eats!`;
  if (orderNotes) {
    body += `\nNote: ${orderNotes}`;
  }

  await smsClient.messages.create({
    body,
    from: fromPhone,
    to: hugoPhone,
  });
}

export async function sendStatusUpdate(status: string, orderId: number) {
  // Could notify Yuge when order status changes
  console.log(`Order #${orderId} status → ${status}`);
}

// lib/tsr.ts

export async function tsrTopup({
  requestId,
  phone,
  telco,
  amount,
}: {
  requestId: string
  phone: string
  telco: string
  amount: number
}) {
  const apiKey = process.env.TSR_API_KEY!;
  const callbackUrl = process.env.TSR_CALLBACK_URL!; // Có thể để trống nếu không cần

  const body = {
    request_id: requestId,
    telco,
    amount,
    phone,
    callback_url: callbackUrl,
  };

  const response = await fetch('https://thesieure.com/chargingws/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'API-Key': apiKey,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return data; // { status, message, transaction_id, ... }
}

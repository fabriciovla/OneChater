import { Resend } from "resend"

export async function sendOTPEmail({
  to,
  code,
  expiresMinutes = 10,
}: {
  to: string
  code: string
  expiresMinutes?: number
}) {
  const digits = code.split("")

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tu código de acceso — OneChater</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo header -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#0E0F12;border-radius:16px;padding:14px 20px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align:middle;padding-right:10px;">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" width="28" height="28">
                            <path d="M 32 22 Q 18 26 18 40 Q 20 54 34 54 Q 48 52 46 38 Q 44 24 32 22 Z" fill="white"/>
                            <path d="M 68 26 Q 56 28 54 40 Q 56 54 70 54 Q 84 52 82 38 Q 80 26 68 26 Z" fill="white"/>
                            <path d="M 50 56 Q 36 58 36 72 Q 38 86 52 84 Q 66 82 64 68 Q 62 56 50 56 Z" fill="white"/>
                          </svg>
                        </td>
                        <td style="vertical-align:middle;">
                          <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.3px;">OneChater</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:20px;padding:40px 40px 36px;box-shadow:0 1px 3px rgba(0,0,0,0.08),0 8px 24px rgba(0,0,0,0.05);">

              <!-- Title -->
              <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0E0F12;letter-spacing:-0.4px;text-align:center;">
                Tu código de acceso
              </p>
              <p style="margin:0 0 32px;font-size:14px;color:#6b7280;text-align:center;line-height:1.5;">
                Ingresá este código en OneChater para iniciar sesión.<br/>
                No lo compartas con nadie.
              </p>

              <!-- OTP code block -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        ${digits
                          .map(
                            (d) => `
                        <td style="padding:0 4px;">
                          <div style="
                            width:48px;height:60px;
                            background:#f9fafb;
                            border:2px solid #e5e7eb;
                            border-radius:12px;
                            display:inline-flex;align-items:center;justify-content:center;
                            font-size:28px;font-weight:800;color:#0E0F12;
                            font-family:'SF Mono',Monaco,'Courier New',monospace;
                            text-align:center;line-height:60px;
                            width:48px;
                          ">${d}</div>
                        </td>`
                          )
                          .join("")}
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Expiry notice -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#fef9f0;border:1px solid #fed7aa;border-radius:10px;padding:12px 16px;text-align:center;">
                    <p style="margin:0;font-size:13px;color:#92400e;">
                      ⏱ Expira en <strong>${expiresMinutes} minutos</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #f3f4f6;margin:0 0 24px;" />

              <!-- Security note -->
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;line-height:1.6;">
                Si no solicitaste este código, podés ignorar este correo con seguridad.<br/>
                Tu cuenta permanece protegida.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#9ca3af;">
                OneChater · El chat con todas las IAs en un solo lugar
              </p>
              <p style="margin:4px 0 0;font-size:11px;color:#d1d5db;">
                Este es un correo automático, por favor no respondas a este mensaje.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error("RESEND_API_KEY no configurada")

  const resend = new Resend(apiKey)
  await resend.emails.send({
    from: "OneChater <onboarding@resend.dev>",
    to,
    subject: `${code} es tu código de acceso a OneChater`,
    html,
  })
}

const RESEND_API_URL = 'https://api.resend.com/emails'

interface MailParams {
  to: string
  subject: string
  html: string
}

/**
 * Envio de e-mails transacionais via Resend (https://resend.com).
 * Sem RESEND_API_KEY configurada, degrada para log no console —
 * o fluxo de desenvolvimento continua funcionando sem conta Resend.
 */
export class ResendMailer {
  get isConfigured(): boolean {
    return Boolean(process.env.RESEND_API_KEY)
  }

  private get from(): string {
    return process.env.EMAIL_FROM || 'Acolhe <onboarding@resend.dev>'
  }

  async send({ to, subject, html }: MailParams): Promise<boolean> {
    if (!this.isConfigured) {
      console.log(`[ResendMailer] RESEND_API_KEY ausente — e-mail não enviado.`)
      console.log(`[ResendMailer] Para: ${to} | Assunto: ${subject}`)
      return false
    }

    try {
      const response = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.from,
          to: [to],
          subject,
          html,
        }),
      })

      if (!response.ok) {
        const body = await response.text()
        console.error(`[ResendMailer] Resend respondeu ${response.status}: ${body}`)
        return false
      }

      return true
    } catch (error) {
      console.error('[ResendMailer] Falha ao enviar e-mail:', error)
      return false
    }
  }
}

export const resendMailer = new ResendMailer()

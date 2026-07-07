import crypto from 'crypto'
import { prisma } from '../lib/prisma'
import { AppError } from '../middlewares/errorHandler'
import { resendMailer } from './ResendMailer'

const TOKEN_TTL_HOURS = 24
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

/**
 * Verificação de e-mail no cadastro: gera o token, envia o link via
 * Resend e confirma a conta. O login só é liberado depois que o
 * endereço for confirmado (quando o envio de e-mail está configurado).
 */
export class EmailVerificationService {
  get enforced(): boolean {
    return resendMailer.isConfigured
  }

  async issueAndSend(user: { id: string; email: string; name: string }): Promise<void> {
    // Invalida tokens anteriores ainda abertos
    await prisma.verificationToken.updateMany({
      where: {
        userId: user.id,
        type: 'EMAIL_VERIFICATION',
        usedAt: null,
      },
      data: { usedAt: new Date() },
    })

    const token = crypto.randomBytes(32).toString('hex')

    await prisma.verificationToken.create({
      data: {
        token,
        userId: user.id,
        type: 'EMAIL_VERIFICATION',
        expiresAt: new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000),
      },
    })

    const link = `${FRONTEND_URL}/verify-email?token=${token}`

    const sent = await resendMailer.send({
      to: user.email,
      subject: 'Confirme seu e-mail — Acolhe',
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: linear-gradient(160deg, #F0FAF8, #E6F4F1); border-radius: 16px; border: 1px solid #CBE8E2;">
          <h1 style="color: #0E7268; font-size: 22px; margin: 0 0 8px;">Acolhe</h1>
          <p style="color: #182B30; font-size: 15px; line-height: 1.6;">
            Olá, <strong>${user.name}</strong>! Falta um passo para ativar sua conta:
            confirme seu e-mail clicando no botão abaixo.
          </p>
          <p style="text-align: center; margin: 28px 0;">
            <a href="${link}"
               style="display: inline-block; padding: 12px 32px; background: linear-gradient(160deg, #1B9C8C, #0E7268); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600;">
              Confirmar e-mail
            </a>
          </p>
          <p style="color: #4A6067; font-size: 12px; line-height: 1.5;">
            O link vale por ${TOKEN_TTL_HOURS} horas. Se você não criou uma conta na Acolhe,
            ignore esta mensagem.
          </p>
        </div>
      `,
    })

    if (!sent && !resendMailer.isConfigured) {
      console.log(`[EmailVerification] Link de verificação (dev): ${link}`)
    }
  }

  async confirm(token: string): Promise<void> {
    const record = await prisma.verificationToken.findUnique({
      where: { token },
      include: { user: { select: { id: true, emailVerifiedAt: true } } },
    })

    if (!record || record.type !== 'EMAIL_VERIFICATION') {
      throw new AppError('Token de verificação inválido', 400)
    }

    if (record.usedAt) {
      // Conta já verificada por este token — idempotente
      if (record.user.emailVerifiedAt) return
      throw new AppError('Token de verificação já utilizado', 400)
    }

    if (record.expiresAt < new Date()) {
      throw new AppError('Token de verificação expirado. Solicite um novo link.', 400)
    }

    await prisma.$transaction([
      prisma.verificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date() },
      }),
    ])
  }
}

export const emailVerificationService = new EmailVerificationService()

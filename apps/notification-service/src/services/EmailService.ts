import nodemailer from 'nodemailer'
import { Notification } from '@medgo/shared-types'

export class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  async send(notification: Notification, recipientEmail: string): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
        to: recipientEmail,
        subject: notification.title,
        text: notification.message,
        html: this.generateEmailHTML(notification),
      })

      console.log('Email sent:', info.messageId)
    } catch (error) {
      console.error('Error sending email:', error)
      throw error
    }
  }

  private generateEmailHTML(notification: Notification): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #3b82f6;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: #f9fafb;
              padding: 20px;
              border: 1px solid #e5e7eb;
              border-top: none;
              border-radius: 0 0 5px 5px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #6b7280;
            }
            .button {
              display: inline-block;
              padding: 10px 20px;
              background-color: #3b82f6;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MedGo</h1>
          </div>
          <div class="content">
            <h2>${notification.title}</h2>
            <p>${notification.message}</p>
            ${notification.data?.actionUrl ? `
              <a href="${notification.data.actionUrl}" class="button">Ver Detalhes</a>
            ` : ''}
          </div>
          <div class="footer">
            <p>Este é um email automático do MedGo. Por favor, não responda.</p>
            <p>&copy; ${new Date().getFullYear()} MedGo. Todos os direitos reservados.</p>
          </div>
        </body>
      </html>
    `
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify()
      console.log('✅ SMTP connection verified')
      return true
    } catch (error) {
      console.error('❌ SMTP connection failed:', error)
      return false
    }
  }
}

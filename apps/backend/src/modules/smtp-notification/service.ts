import { AbstractNotificationProviderService, MedusaError } from "@medusajs/framework/utils"
import type { ProviderSendNotificationDTO, ProviderSendNotificationResultsDTO } from "@medusajs/framework/types"
import nodemailer, { type Transporter } from "nodemailer"

type Options = { host: string; port: number; secure?: boolean; user?: string; pass?: string; from: string }

/**
 * Envoi d'e-mails par SMTP. Fonctionne avec Resend (smtp.resend.com), Brevo (smtp-relay.brevo.com)
 * ou un serveur de capture en local. Le contenu (sujet, HTML, texte) est rendu en amont (src/lib/emails.ts).
 */
class SmtpNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "smtp"
  protected transporter: Transporter
  protected from: string

  static validateOptions(options: Record<string, unknown>) {
    if (!options.host || !options.port || !options.from) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "smtp-notification : host, port et from sont requis")
    }
  }

  constructor(_deps: Record<string, unknown>, options: Options) {
    super()
    this.from = options.from
    this.transporter = nodemailer.createTransport({
      host: options.host,
      port: options.port,
      secure: options.secure ?? options.port === 465,
      auth: options.user ? { user: options.user, pass: options.pass } : undefined,
      connectionTimeout: 10_000,
      socketTimeout: 15_000,
    })
  }

  async send(n: ProviderSendNotificationDTO): Promise<ProviderSendNotificationResultsDTO> {
    if (n.channel !== "email") throw new MedusaError(MedusaError.Types.INVALID_DATA, `Canal non pris en charge : ${n.channel}`)
    if (!n.content?.subject || !(n.content.html || n.content.text)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "E-mail sans sujet ni contenu")
    }
    const bcc = typeof n.provider_data?.bcc === "string" ? n.provider_data.bcc : undefined
    const info = await this.transporter.sendMail({
      from: n.from ?? this.from,
      to: n.to,
      bcc,
      subject: n.content.subject,
      html: n.content.html,
      text: n.content.text,
    })
    return { id: info.messageId }
  }
}

export default SmtpNotificationProviderService

import nodemailer from "nodemailer";
import { ConnectionPoolManager } from "./connection-pool";

interface EmailConfig {
  email: string;
  username: string;
  smtp_server: string;
  port_ssl: number;
  port_starttls: number;
  authentication_required: boolean;
  ssl_enabled: boolean;
  starttls_enabled: boolean;
  password_env: string;
}

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig | null = null;

  async initialize() {
    try {
      // Load email configuration from settingdb
      const settingsPool = ConnectionPoolManager.getInstance().getPool();
      let result = await settingsPool.query(
        "SELECT value FROM settings WHERE category = 'system' AND key_name = 'Mailserver_Portal' ORDER BY created_at DESC LIMIT 1"
      );

      // Create configuration if it doesn't exist
      if (result.rows.length === 0) {
        console.log('📧 Mailserver_Portal Konfiguration nicht gefunden, erstelle neuen Eintrag...');
        
        const defaultConfig = {
          email: "portal@monitoring.direct",
          username: "monitoring-direct-0002",
          smtp_server: "smtps.udag.de",
          port_ssl: 465,
          port_starttls: 587,
          authentication_required: true,
          ssl_enabled: true,
          starttls_enabled: true,
          password_env: "MAILSERVER_PASSWORD"
        };

        await settingsPool.query(
          "INSERT INTO settings (category, key_name, value, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())",
          ['system', 'Mailserver_Portal', JSON.stringify(defaultConfig)]
        );
        
        console.log('✅ Mailserver_Portal Konfiguration in Portal-DB erstellt');
        
        // Load the newly created configuration
        result = await settingsPool.query(
          "SELECT value FROM settings WHERE category = 'system' AND key_name = 'Mailserver_Portal' ORDER BY created_at DESC LIMIT 1"
        );
      }

      // Also ensure email template exists
      const templateResult = await settingsPool.query(
        "SELECT value FROM settings WHERE category = 'system' AND key_name = 'Mailserver_Passwort' ORDER BY created_at DESC LIMIT 1"
      );

      if (templateResult.rows.length === 0) {
        console.log('📧 Mailserver_Passwort Template nicht gefunden, erstelle neuen Eintrag...');
        
        const defaultTemplate = {
          subject: "Portal-Nachricht: Handeln : Zugang",
          html: "Neue Zugangsdaten für das heimkehr Portal<br><br>Ihr neues Passwort: {PASSWORD}<br><br>Sie können sich hier anmelden: {URL}<br><br><br>Mit freundlichen Grüßen<br>Das heimkehr Portal Team"
        };

        await settingsPool.query(
          "INSERT INTO settings (category, key_name, value, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())",
          ['system', 'Mailserver_Passwort', JSON.stringify(defaultTemplate)]
        );
        
        console.log('✅ Mailserver_Passwort Template in Portal-DB erstellt');
      }

      this.config = result.rows[0].value as EmailConfig;

      // Get password from environment variable
      const password = process.env.MAILSERVER_PASSWORD;
      if (!password) {
        throw new Error('MAILSERVER_PASSWORD environment variable not set');
      }

      console.log('🔍 [EMAIL] Attempting SMTP connection with:');
      console.log(`   Host: ${this.config.smtp_server}`);
      console.log(`   Port: ${this.config.ssl_enabled ? this.config.port_ssl : this.config.port_starttls}`);
      console.log(`   User: ${this.config.username}`);
      console.log(`   SSL: ${this.config.ssl_enabled}`);
      console.log(`   Password length: ${password.length} chars`);

      // Try port 587 with STARTTLS first (more reliable)
      const useSTARTTLS = true;
      const port = useSTARTTLS ? this.config.port_starttls : this.config.port_ssl;
      const secure = !useSTARTTLS; // false for STARTTLS (587), true for SSL (465)

      console.log(`🔍 [EMAIL] Using ${useSTARTTLS ? 'STARTTLS' : 'SSL'} on port ${port}`);

      // Create transporter with enhanced configuration
      this.transporter = nodemailer.createTransport({
        host: this.config.smtp_server,
        port: port,
        secure: secure,
        name: 'monitoring.direct', // Required for HELO/EHLO command
        auth: {
          user: this.config.username,
          pass: password,
        },
        tls: {
          // Certificate verification: strict in production, relaxed in development
          rejectUnauthorized: process.env.NODE_ENV === 'production',
          minVersion: 'TLSv1.2', // Enforce TLS 1.2 or higher
          // Optionally specify custom CA certificate
          ...(process.env.MAILSERVER_CA_CERT && {
            ca: process.env.MAILSERVER_CA_CERT,
          }),
        },
        debug: false, // Disable debug output
        logger: false, // Disable logger (too verbose)
      });

      // Verify connection
      console.log('🔍 [EMAIL] Verifying SMTP connection...');
      await this.transporter.verify();
      console.log('✅ E-Mail-Service erfolgreich initialisiert');
      return true;
    } catch (error) {
      console.error('❌ Fehler beim Initialisieren des E-Mail-Service:', error);
      return false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter || !this.config) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('E-Mail-Service konnte nicht initialisiert werden');
      }
    }

    try {
      const mailOptions = {
        from: options.from || this.config!.email,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      const info = await this.transporter!.sendMail(mailOptions);
      console.log('✅ E-Mail erfolgreich gesendet:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Fehler beim Senden der E-Mail:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.transporter) {
        await this.initialize();
      }
      if (this.transporter) {
        await this.transporter.verify();
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ E-Mail-Verbindungstest fehlgeschlagen:', error);
      return false;
    }
  }
}

// Singleton instance
export const emailService = new EmailService();
import nodemailer from "nodemailer";

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

// Configuração de email (usar variáveis de ambiente em produção)
const emailConfig: EmailConfig = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true para 465, false para outras portas
  user: process.env.SMTP_USER || "your-email@gmail.com",
  pass: process.env.SMTP_PASS || "your-app-password",
};

// Criar transporter do nodemailer
const transporter = nodemailer.createTransport({
  host: emailConfig.host,
  port: emailConfig.port,
  secure: emailConfig.secure,
  auth: {
    user: emailConfig.user,
    pass: emailConfig.pass,
  },
});

// Verificar conexão com o servidor de email
export const verifyEmailConnection = async (): Promise<boolean> => {
  try {
    await transporter.verify();
    console.log("📧 Servidor de email conectado com sucesso");
    return true;
  } catch (error) {
    console.error("❌ Erro ao conectar com servidor de email:", error);
    return false;
  }
};

// Enviar email de recuperação de senha
export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  resetToken: string
): Promise<boolean> => {
  try {
    const resetUrl = `${
      process.env.FRONTEND_URL || "http://localhost:5173"
    }/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"JusCRM" <${emailConfig.user}>`,
      to: email,
      subject: "Recuperação de Senha - JusCRM",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center;">
            <h1>JusCRM</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9fafb;">
            <h2>Olá, ${name}!</h2>
            
            <p>Você solicitou a recuperação da sua senha no JusCRM.</p>
            
            <p>Clique no botão abaixo para redefinir sua senha:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #3b82f6; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 6px; display: inline-block;">
                Redefinir Senha
              </a>
            </div>
            
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; color: #6b7280; font-size: 14px;">
              ${resetUrl}
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px;">
                <strong>Importante:</strong> Este link expira em 1 hora por segurança.
              </p>
              <p style="color: #6b7280; font-size: 14px;">
                Se você não solicitou esta recuperação, ignore este email.
              </p>
            </div>
          </div>
          
          <div style="background-color: #374151; color: #9ca3af; padding: 20px; text-align: center; font-size: 14px;">
            <p>© 2025 JusCRM. Todos os direitos reservados.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Email de recuperação enviado para: ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Erro ao enviar email de recuperação:", error);
    return false;
  }
};

// Enviar email de verificação
export const sendEmailVerification = async (
  email: string,
  name: string,
  verificationToken: string
): Promise<boolean> => {
  try {
    const verificationUrl = `${
      process.env.FRONTEND_URL || "http://localhost:5173"
    }/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: `"JusCRM" <${emailConfig.user}>`,
      to: email,
      subject: "Verificação de Email - JusCRM",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #059669; color: white; padding: 20px; text-align: center;">
            <h1>Bem-vindo ao JusCRM!</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9fafb;">
            <h2>Olá, ${name}!</h2>
            
            <p>Obrigado por se cadastrar no JusCRM.</p>
            
            <p>Para completar seu cadastro, precisamos verificar seu email.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #059669; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 6px; display: inline-block;">
                Verificar Email
              </a>
            </div>
            
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; color: #6b7280; font-size: 14px;">
              ${verificationUrl}
            </p>
          </div>
          
          <div style="background-color: #374151; color: #9ca3af; padding: 20px; text-align: center; font-size: 14px;">
            <p>© 2025 JusCRM. Todos os direitos reservados.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Email de verificação enviado para: ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Erro ao enviar email de verificação:", error);
    return false;
  }
};

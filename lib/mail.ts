import { Resend } from "resend";
const resend = new Resend(process.env.AUTH_RESEND_KEY || 're_RtsCVCn5_FGgLYqakR9RabQ7VyQdaeQNG');


export const sendEmailVerification = async (email: string, token: string) => {
  try {
    await resend.emails.send({
      from: "Registro en Aizenbots <pro@aizenbots.com>",
      to: email,
      subject: "Verificacion de Correo Electronico",
      html: `
        <p>Click para verficar su correo electronico</p>
        <a href="${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}">Verficacion de Correo</a>
      `,
    });

    return {
      success: true,
    };
  } catch (error) {
    console.log(error);
    return {
      error: true,
    };
  }
};

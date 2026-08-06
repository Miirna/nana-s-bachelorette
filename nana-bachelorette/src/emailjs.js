import emailjs from '@emailjs/browser';

// Configuración de EmailJS (gratis, sin backend).
// Crea una cuenta en https://www.emailjs.com/, conecta tu correo (Gmail, etc.)
// y reemplaza los valores de abajo con los que te da tu dashboard de EmailJS.
const EMAILJS_SERVICE_ID = "service_puznq74";
const EMAILJS_TEMPLATE_CODIGO = "template_o2xgmlw";
const EMAILJS_TEMPLATE_NOVIA = "template_9jvfux3";
const EMAILJS_PUBLIC_KEY = "DYIlHHyTTzKVqElZC";

// Correo de la novia/organizadora, para las notificaciones de confirmaciones.
const CORREO_NOVIA = "miirna.valdiiviia@gmail.com";

export function enviarCodigoVerificacion({ correoDestino, nombre, codigo }) {
  return emailjs.send(
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_CODIGO,
    {
      to_email: correoDestino,
      to_name: nombre,
      codigo
    },
    { publicKey: EMAILJS_PUBLIC_KEY }
  );
}

export function notificarConfirmacionANovia({ nombreInvitada }) {
  return emailjs.send(
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_NOVIA,
    {
      to_email: CORREO_NOVIA,
      nombre_invitada: nombreInvitada
    },
    { publicKey: EMAILJS_PUBLIC_KEY }
  );
}

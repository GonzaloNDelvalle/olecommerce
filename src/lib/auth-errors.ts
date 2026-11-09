/**
 * Traduce los errores de Better Auth a mensajes para la clienta.
 */
export function authErrorMessage(
  error: { code?: string; status?: number; message?: string } | null | undefined
): string {
  if (!error) return "Ocurrió un error inesperado. Intentá nuevamente.";
  if (error.status === 429) {
    return "Demasiados intentos. Esperá unos minutos y volvé a probar.";
  }
  switch (error.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "El correo electrónico o la contraseña son incorrectos.";
    case "EMAIL_NOT_VERIFIED":
      return "Tenés que confirmar tu email antes de ingresar. Te reenviamos el link: revisá tu casilla y la carpeta de spam.";
    case "PASSWORD_TOO_SHORT":
      return "La contraseña debe tener al menos 8 caracteres.";
    case "PASSWORD_TOO_LONG":
      return "La contraseña no puede superar los 72 caracteres.";
    case "INVALID_TOKEN":
    case "TOKEN_EXPIRED":
      return "El link venció o ya fue utilizado. Pedí uno nuevo.";
    case "USER_NOT_FOUND":
      return "No encontramos una cuenta con esos datos.";
    case "FAILED_TO_CREATE_SESSION":
      return "Tu cuenta está desactivada. Escribinos para ayudarte.";
    default:
      return "No pudimos completar la operación. Intentá nuevamente.";
  }
}

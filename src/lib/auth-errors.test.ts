import { describe, expect, it } from "vitest";
import { authErrorMessage } from "./auth-errors";

describe("authErrorMessage", () => {
  it("traduce credenciales inválidas", () => {
    expect(authErrorMessage({ code: "INVALID_EMAIL_OR_PASSWORD" })).toMatch(
      /incorrectos/
    );
  });

  it("explica el email sin verificar", () => {
    expect(authErrorMessage({ code: "EMAIL_NOT_VERIFIED" })).toMatch(
      /confirmar tu email/
    );
  });

  it("prioriza el límite de intentos", () => {
    expect(
      authErrorMessage({ status: 429, code: "INVALID_EMAIL_OR_PASSWORD" })
    ).toMatch(/Demasiados intentos/);
  });

  it("tiene un mensaje genérico para errores desconocidos", () => {
    expect(authErrorMessage({ code: "ALGO_NUEVO" })).toMatch(/No pudimos/);
  });
});

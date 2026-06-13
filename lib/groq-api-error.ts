/** Error lanzado por las llamadas a las rutas API de Body Matter (Groq / cuotas). */
export class GroqApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "GroqApiError";
    this.status = status;
  }
}

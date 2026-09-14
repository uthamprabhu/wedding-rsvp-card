declare module 'canvas-confetti' {
  type ConfettiOptions = Record<string, unknown>;
  type Confetti = (options: ConfettiOptions) => Promise<null>;
  const confetti: Confetti;
  export default confetti;
}

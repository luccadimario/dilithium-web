export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="animate-float mb-6">
        <svg width="72" height="72" viewBox="0 0 64 64" className="animate-pulse-glow">
          <polygon points="32,6 20,28 32,36 44,28" fill="#00bfef" opacity="0.95" />
          <polygon points="20,28 32,36 32,58" fill="#0891b2" opacity="0.85" />
          <polygon points="44,28 32,36 32,58" fill="#067a8f" opacity="0.75" />
        </svg>
      </div>
      <h1 className="font-heading text-lg font-bold tracking-widest text-gradient-crystal mb-2">
        DILITHIUM
      </h1>
      <p className="text-space-600 text-xs font-mono tracking-wider">
        Initializing quantum-safe crypto...
      </p>
    </div>
  );
}

export default function AppBackground() {
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: "var(--bg)" }}
    >
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          top: "-20%",
          left: "-10%",
          width: "60%",
          height: "60%",
          filter: "blur(120px)",
          opacity: 0.12,
          background: "radial-gradient(circle, #00d68f 0%, transparent 70%)",
          transform: "translateZ(0)",
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          bottom: "-20%",
          right: "-10%",
          width: "60%",
          height: "60%",
          filter: "blur(120px)",
          opacity: 0.08,
          background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)",
          transform: "translateZ(0)",
        }}
      />
      <div
        className="absolute inset-0 opacity-50 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}

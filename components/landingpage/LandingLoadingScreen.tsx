export function LandingLoadingScreen() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading ATLAS"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "grid",
        placeContent: "center",
        justifyItems: "center",
        gap: 18,
        background: "#0B0820",
        color: "#F4F1FF",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <style>{`@keyframes atlas-loading-spin{to{transform:rotate(360deg)}}`}</style>
      <span
        aria-hidden="true"
        style={{
          width: 42,
          height: 42,
          border: "3px solid rgba(196,181,253,.24)",
          borderTopColor: "#C4B5FD",
          borderRadius: "50%",
          animation: "atlas-loading-spin .8s linear infinite",
        }}
      />
      <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".2em" }}>
        LOADING ATLAS
      </span>
    </div>
  );
}

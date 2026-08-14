export default function Loading() {
  return (
    <main className="room-shell loading-shell" aria-busy="true">
      <div className="loading-card">
        <div className="skeleton skeleton--badge" />
        <div className="skeleton skeleton--title" />
        <div className="skeleton skeleton--button" />
        <div className="skeleton skeleton--button" />
      </div>
    </main>
  );
}

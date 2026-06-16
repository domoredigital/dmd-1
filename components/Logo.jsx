export default function Logo({ scale = 1 }) {
  return (
    <div
      className="logo-d"
      style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}
    >
      <div className="logo-rule" />
      <div className="logo-eyebrow">Do More</div>
      <div className="logo-word">Questions</div>
      <div className="logo-rule-b" />
    </div>
  );
}

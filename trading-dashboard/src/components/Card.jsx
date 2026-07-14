export default function Card({ children, className = '', gold = false, style }) {
  return (
    <div
      className={`rounded-xl border bg-black/30 backdrop-blur-sm p-4 ${gold ? 'border-[#D4AF37]/25' : 'border-slate-800/60'} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

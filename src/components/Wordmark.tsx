interface WordmarkProps {
  tone?: 'light' | 'dark';
  className?: string;
}

/** Text logo lockup: "IN DESIGN" over "LUXURY FABRICS". */
export default function Wordmark({ tone = 'light', className = '' }: WordmarkProps) {
  return (
    <span className={`inline-flex flex-col leading-none ${className}`}>
      <span
        className={`font-serif text-[19px] font-semibold uppercase tracking-[0.24em] ${
          tone === 'light' ? 'text-ivory' : 'text-ink'
        }`}
      >
        In&nbsp;Design
      </span>
      <span className="mt-1.5 text-[8.5px] font-semibold uppercase tracking-[0.52em] text-gold">
        Luxury&nbsp;Fabrics
      </span>
    </span>
  );
}

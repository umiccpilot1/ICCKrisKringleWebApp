export default function Button({ children, variant = 'primary', ...props }) {
  const base = 'inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aurora/60';
  const styles = {
    primary: `${base} bg-gradient-to-r from-aurora via-iris to-orchid text-white shadow-glow hover:shadow-lg hover:shadow-aurora/40`,
    secondary: `${base} border border-white/20 bg-white/5 text-slate-200 backdrop-blur hover:border-aurora/40 hover:text-white`,
    ghost: `${base} text-slate-300 hover:text-white hover:bg-white/5`
  };

  return (
    <button type="button" className={styles[variant] || styles.primary} {...props}>
      {children}
    </button>
  );
}

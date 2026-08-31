const styles = {
  error: 'bg-danger/10 text-danger border-danger/20',
  success: 'bg-success/10 text-success border-success/20',
  info: 'bg-navy-50 text-navy-700 border-navy-100',
};

export default function Alert({ variant = 'info', children }) {
  if (!children) return null;
  return (
    <div className={`rounded-card border px-4 py-3 text-sm font-medium ${styles[variant]}`} role="status">
      {children}
    </div>
  );
}

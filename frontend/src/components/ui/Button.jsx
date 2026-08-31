export default function Button({
  children, variant = 'primary', isLoading = false, className = '', ...props
}) {
  const base = variant === 'primary' ? 'btn-primary' : 'btn-secondary';
  return (
    <button className={`${base} ${className}`} disabled={isLoading || props.disabled} {...props}>
      {isLoading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      {children}
    </button>
  );
}

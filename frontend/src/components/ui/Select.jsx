export default function Select({ label, id, error, className = '', children, ...props }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="field-label">
          {label}
        </label>
      )}
      <select id={id} className="field-input" {...props}>
        {children}
      </select>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export default function Input({ label, error, id, className = '', ...props }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="field-label">
          {label}
        </label>
      )}
      <input id={id} className="field-input" {...props} />
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

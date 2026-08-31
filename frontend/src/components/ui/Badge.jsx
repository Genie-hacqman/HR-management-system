const statusStyles = {
  active: 'bg-success/10 text-success',
  trial: 'bg-amber-100 text-amber-700',
  inactive: 'bg-ink/10 text-ink/60',
  suspended: 'bg-danger/10 text-danger',
  cancelled: 'bg-ink/10 text-ink/50',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-success/10 text-success',
  rejected: 'bg-danger/10 text-danger',
};

export function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyles[status] || 'bg-ink/10 text-ink/60'}`}>
      {status}
    </span>
  );
}

export function RoleBadge({ role }) {
  return (
    <span className="rounded-full bg-navy-50 px-2.5 py-1 text-xs font-medium capitalize text-navy-700">
      {role.replace('_', ' ')}
    </span>
  );
}

import { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/modals/Modal';
import { StatusBadge, RoleBadge } from '../../components/ui/Badge';
import * as userService from '../../services/userService';

const ASSIGNABLE_ROLES = ['company_admin', 'manager', 'employee'];

export default function TeamManagement() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ firstName: '', lastName: '', email: '', roles: ['employee'] });
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const [rolesEditingUser, setRolesEditingUser] = useState(null);
  const [editRoles, setEditRoles] = useState([]);

  async function loadUsers(params = {}) {
    setIsLoading(true);
    try {
      const list = await userService.listUsers(params);
      setUsers(list);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load team members.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function toggleInviteRole(role) {
    setInviteForm((f) => ({
      ...f,
      roles: f.roles.includes(role) ? f.roles.filter((r) => r !== role) : [...f.roles, role],
    }));
  }

  async function handleInvite(e) {
    e.preventDefault();
    setInviteError('');
    setIsInviting(true);
    try {
      await userService.inviteUser(inviteForm);
      setIsInviteOpen(false);
      setInviteForm({ firstName: '', lastName: '', email: '', roles: ['employee'] });
      setMessage('Invitation sent — they will receive an email to set their password.');
      loadUsers();
    } catch (err) {
      setInviteError(err.response?.data?.message || 'Unable to invite this user.');
    } finally {
      setIsInviting(false);
    }
  }

  function openRoleEditor(user) {
    setRolesEditingUser(user);
    setEditRoles(user.roles || []);
  }

  function toggleEditRole(role) {
    setEditRoles((r) => (r.includes(role) ? r.filter((x) => x !== role) : [...r, role]));
  }

  async function saveRoles() {
    try {
      await userService.setUserRoles(rolesEditingUser.id, editRoles);
      setRolesEditingUser(null);
      setMessage('Roles updated.');
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update roles.');
    }
  }

  async function toggleStatus(user) {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      await userService.setUserStatus(user.id, nextStatus);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update status.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Team</h1>
          <p className="mt-1 text-sm text-ink/60">Invite people into your company and manage their roles.</p>
        </div>
        <Button onClick={() => setIsInviteOpen(true)}>Invite person</Button>
      </div>

      <Alert variant="error">{error}</Alert>
      <Alert variant="success">{message}</Alert>

      <div className="card p-4">
        <Input
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadUsers({ search })}
        />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-navy-50/40 text-left text-xs font-medium uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Roles</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-ink/40">Loading team…</td></tr>
            )}
            {!isLoading && users.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-ink/40">No team members yet. Invite your first colleague.</td></tr>
            )}
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{user.first_name} {user.last_name}</td>
                <td className="px-4 py-3 text-ink/70">{user.email}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(user.roles || []).map((r) => <RoleBadge key={r} role={r} />)}
                  </div>
                </td>
                <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => openRoleEditor(user)} className="text-xs font-medium text-navy-700 hover:underline">
                    Edit roles
                  </button>
                  <button onClick={() => toggleStatus(user)} className="text-xs font-medium text-danger hover:underline">
                    {user.status === 'active' ? 'Suspend' : 'Reactivate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Invite a person">
        <form onSubmit={handleInvite} className="space-y-4">
          <Alert variant="error">{inviteError}</Alert>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First name"
              value={inviteForm.firstName}
              onChange={(e) => setInviteForm((f) => ({ ...f, firstName: e.target.value }))}
              required
            />
            <Input
              label="Last name"
              value={inviteForm.lastName}
              onChange={(e) => setInviteForm((f) => ({ ...f, lastName: e.target.value }))}
              required
            />
          </div>
          <Input
            label="Work email"
            type="email"
            value={inviteForm.email}
            onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
          <div>
            <p className="field-label">Roles</p>
            <div className="flex flex-wrap gap-2">
              {ASSIGNABLE_ROLES.map((role) => (
                <button
                  type="button"
                  key={role}
                  onClick={() => toggleInviteRole(role)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    inviteForm.roles.includes(role)
                      ? 'border-navy-700 bg-navy-700 text-white'
                      : 'border-border bg-panel text-ink/70 hover:bg-navy-50'
                  }`}
                >
                  {role.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" isLoading={isInviting} className="w-full">Send invitation</Button>
        </form>
      </Modal>

      <Modal isOpen={!!rolesEditingUser} onClose={() => setRolesEditingUser(null)} title="Edit roles">
        {rolesEditingUser && (
          <div className="space-y-4">
            <p className="text-sm text-ink/60">
              {rolesEditingUser.first_name} {rolesEditingUser.last_name}
            </p>
            <div className="flex flex-wrap gap-2">
              {ASSIGNABLE_ROLES.map((role) => (
                <button
                  type="button"
                  key={role}
                  onClick={() => toggleEditRole(role)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    editRoles.includes(role)
                      ? 'border-navy-700 bg-navy-700 text-white'
                      : 'border-border bg-panel text-ink/70 hover:bg-navy-50'
                  }`}
                >
                  {role.replace('_', ' ')}
                </button>
              ))}
            </div>
            <Button onClick={saveRoles} className="w-full">Save roles</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

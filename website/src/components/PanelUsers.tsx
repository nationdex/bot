import { AnimatePresence, motion } from 'framer-motion';
import { ConfirmModal } from '@/components/ConfirmModal';
import { PanelUsersSkeleton } from '@/components/SectionSkeleton';
import { TablePagination } from '@/components/TablePagination';
import { UnsavedChangesBar } from '@/components/UnsavedChangesBar';
import { ArrowLeft, ArrowRight, Check, FolderGit2, Plus, Search, StarPlus, Trash2, UserPlus, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { createPanelGroup, createPanelUser, deletePanelGroup, deletePanelUser, fetchPanelGroups, fetchPanelUsers, transferPanelOwnership, updatePanelGroup, updatePanelUser, type PanelGroup, type PanelUser } from '@/lib/auth';
import { useMotionPref } from '@/hooks/useReducedMotion';
import { listItem, springSnappy, staggerContainer } from '@/lib/motion';
import { cn } from '@/lib/utils';

const availablePermissions: Array<{ key: string; label: string; description: string }> = [
  { key: '*', label: 'Full Access (*)', description: 'Unrestricted control over all panel features and administrative settings' },
  { key: 'view_dashboard', label: 'View Dashboard', description: 'Access to statistics, metrics, and overview charts' },
  { key: 'manage_nations', label: 'Manage Nations', description: 'Create, edit, and manage nation collectibles and catalog' },
  { key: 'manage_users', label: 'Manage Bot Users', description: 'View player inventories, balances, and gift settings' },
  { key: 'manage_servers', label: 'Manage Servers', description: 'Manage guild spawn configs and active server settings' },
  { key: 'manage_cards', label: 'Manage Cards', description: 'Upload and configure regime and special card art' },
  { key: 'manage_bot_settings', label: 'Manage Bot Settings', description: 'Configure system parameters and rarity thresholds' },
  { key: 'manage_panel_users', label: 'Manage Panel Users', description: 'Create, edit, and delete staff accounts and passwords' },
  { key: 'manage_groups', label: 'Manage Groups & Roles', description: 'Create and divide staff groups and permission roles' },
];

const presetColors = [
  { name: 'Purple', value: '#a855f7' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Indigo', value: '#6366f1' },
];

export default function PanelUsersPage({ currentUser }: { currentUser?: PanelUser | null }) {
  const listReveal = useMotionPref('listReveal');
  const [activeTab, setActiveTab] = useState<'users' | 'groups'>('users');
  const [viewMode, setViewMode] = useState<'list' | 'user_form' | 'group_form'>('list');

  const [users, setUsers] = useState<PanelUser[]>([]);
  const [groups, setGroups] = useState<PanelGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupSearchQuery, setGroupSearchQuery] = useState('');

  const [editingUser, setEditingUser] = useState<PanelUser | null>(null);
  const [userUsername, setUserUsername] = useState('');
  const [userDisplayName, setUserDisplayName] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState<'owner' | 'admin' | 'member'>('member');
  const [userGroupId, setUserGroupId] = useState<number | null>(null);
  const [userPerms, setUserPerms] = useState<string[]>(['view_dashboard']);
  const [isUserFormDirty, setIsUserFormDirty] = useState(false);
  const [initialUserForm, setInitialUserForm] = useState({
    username: '',
    displayName: '',
    role: 'member' as 'owner' | 'admin' | 'member',
    groupId: null as number | null,
    permissions: ['view_dashboard'] as string[],
  });

  const [editingGroup, setEditingGroup] = useState<PanelGroup | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [groupColor, setGroupColor] = useState('#a855f7');
  const [groupPerms, setGroupPerms] = useState<string[]>(['view_dashboard']);
  const [isGroupFormDirty, setIsGroupFormDirty] = useState(false);
  const [initialGroupForm, setInitialGroupForm] = useState({
    name: '',
    description: '',
    color: '#a855f7',
    permissions: ['view_dashboard'] as string[],
  });

  const [ownerModalOpen, setOwnerModalOpen] = useState(false);
  const [targetOwnerUser, setTargetOwnerUser] = useState<PanelUser | null>(null);

  const [deleteConfirmUser, setDeleteConfirmUser] = useState<PanelUser | null>(null);
  const [deleteConfirmGroup, setDeleteConfirmGroup] = useState<PanelGroup | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isOwner = currentUser?.role === 'owner';

  const loadData = async () => {
    setLoading(true);
    const [userData, groupData] = await Promise.all([fetchPanelUsers(), fetchPanelGroups()]);
    if (userData?.users) setUsers(userData.users);
    if (groupData?.groups) setGroups(groupData.groups);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetUserFormToInitial = () => {
    setUserUsername(initialUserForm.username);
    setUserDisplayName(initialUserForm.displayName);
    setUserPassword('');
    setUserRole(initialUserForm.role);
    setUserGroupId(initialUserForm.groupId);
    setUserPerms(initialUserForm.permissions);
    setIsUserFormDirty(false);
  };

  const openAddUser = () => {
    const defaultGroup = groups[0]?.id ?? null;
    setEditingUser(null);
    setUserUsername('');
    setUserDisplayName('');
    setUserPassword('');
    setUserRole('member');
    setUserGroupId(defaultGroup);
    setUserPerms(['view_dashboard']);
    setInitialUserForm({
      username: '',
      displayName: '',
      role: 'member',
      groupId: defaultGroup,
      permissions: ['view_dashboard'],
    });
    setIsUserFormDirty(false);
    setFormError('');
    setViewMode('user_form');
  };

  const openEditUser = (u: PanelUser) => {
    const username = u.username || '';
    const displayName = u.displayName || '';
    const role = u.role || 'member';
    const groupId = u.groupId ?? null;
    const permissions = u.permissions || ['view_dashboard'];

    setEditingUser(u);
    setUserUsername(username);
    setUserDisplayName(displayName);
    setUserPassword('');
    setUserRole(role);
    setUserGroupId(groupId);
    setUserPerms(permissions);
    setInitialUserForm({
      username,
      displayName,
      role,
      groupId,
      permissions,
    });
    setIsUserFormDirty(false);
    setFormError('');
    setViewMode('user_form');
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    if (editingUser) {
      const res = await updatePanelUser(editingUser.id, {
        username: userUsername,
        password: userPassword || undefined,
        displayName: userDisplayName,
        role: userRole,
        groupId: userGroupId,
        permissions: userPerms,
      });
      setSubmitting(false);
      if (res.ok) {
        if (res.users) setUsers(res.users);
        setIsUserFormDirty(false);
        setViewMode('list');
      } else {
        setFormError(res.error ?? 'Failed to update user.');
      }
    } else {
      const res = await createPanelUser({
        username: userUsername,
        password: userPassword,
        displayName: userDisplayName,
        role: userRole,
        groupId: userGroupId,
        permissions: userPerms,
      });
      setSubmitting(false);
      if (res.ok) {
        if (res.users) setUsers(res.users);
        setIsUserFormDirty(false);
        setViewMode('list');
      } else {
        setFormError(res.error ?? 'Failed to create user.');
      }
    }
  };

  const handleDeleteUser = (u: PanelUser) => {
    setDeleteConfirmUser(u);
  };

  const executeDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    setDeletingLoading(true);
    const res = await deletePanelUser(deleteConfirmUser.id);
    setDeletingLoading(false);
    if (res.ok && res.users) {
      setUsers(res.users);
      if (viewMode === 'user_form') setViewMode('list');
    }
    setDeleteConfirmUser(null);
  };

  const handleTransferOwnership = async () => {
    if (!targetOwnerUser) return;
    setSubmitting(true);
    const res = await transferPanelOwnership(targetOwnerUser.id);
    setSubmitting(false);
    if (res.ok) {
      if (res.users) setUsers(res.users);
      setOwnerModalOpen(false);
      setTargetOwnerUser(null);
      window.location.reload();
    }
  };

  const resetGroupFormToInitial = () => {
    setGroupName(initialGroupForm.name);
    setGroupDesc(initialGroupForm.description);
    setGroupColor(initialGroupForm.color);
    setGroupPerms(initialGroupForm.permissions);
    setIsGroupFormDirty(false);
  };

  const openAddGroup = () => {
    setEditingGroup(null);
    setGroupName('');
    setGroupDesc('');
    setGroupColor('#a855f7');
    setGroupPerms(['view_dashboard']);
    setInitialGroupForm({
      name: '',
      description: '',
      color: '#a855f7',
      permissions: ['view_dashboard'],
    });
    setIsGroupFormDirty(false);
    setFormError('');
    setViewMode('group_form');
  };

  const openEditGroup = (g: PanelGroup) => {
    const name = g.name || '';
    const description = g.description || '';
    const color = g.color || '#a855f7';
    const permissions = g.permissions || ['view_dashboard'];

    setEditingGroup(g);
    setGroupName(name);
    setGroupDesc(description);
    setGroupColor(color);
    setGroupPerms(permissions);
    setInitialGroupForm({
      name,
      description,
      color,
      permissions,
    });
    setIsGroupFormDirty(false);
    setFormError('');
    setViewMode('group_form');
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    if (editingGroup) {
      const res = await updatePanelGroup(editingGroup.id, {
        name: groupName,
        description: groupDesc,
        color: groupColor,
        permissions: groupPerms,
      });
      setSubmitting(false);
      if (res.ok) {
        if (res.groups) setGroups(res.groups);
        setViewMode('list');
      } else {
        setFormError(res.error ?? 'Failed to update group.');
      }
    } else {
      const res = await createPanelGroup({
        name: groupName,
        description: groupDesc,
        color: groupColor,
        permissions: groupPerms,
      });
      setSubmitting(false);
      if (res.ok) {
        if (res.groups) setGroups(res.groups);
        setViewMode('list');
      } else {
        setFormError(res.error ?? 'Failed to create group.');
      }
    }
  };

  const handleDeleteGroup = (g: PanelGroup) => {
    setDeleteConfirmGroup(g);
  };

  const executeDeleteGroup = async () => {
    if (!deleteConfirmGroup) return;
    setDeletingLoading(true);
    const res = await deletePanelGroup(deleteConfirmGroup.id);
    setDeletingLoading(false);
    if (res.ok && res.groups) {
      setGroups(res.groups);
      if (viewMode === 'group_form') setViewMode('list');
    }
    setDeleteConfirmGroup(null);
  };

  const toggleUserPerm = (key: string) => {
    setIsUserFormDirty(true);
    if (key === '*') {
      setUserPerms(userPerms.includes('*') ? ['view_dashboard'] : ['*']);
      return;
    }
    if (userPerms.includes('*')) {
      const withoutStar = userPerms.filter((p) => p !== '*');
      setUserPerms(withoutStar.includes(key) ? withoutStar.filter((p) => p !== key) : [...withoutStar, key]);
      return;
    }
    setUserPerms(
      userPerms.includes(key) ? userPerms.filter((p) => p !== key) : [...userPerms, key]
    );
  };

  const toggleGroupPerm = (key: string) => {
    setIsGroupFormDirty(true);
    if (key === '*') {
      setGroupPerms(groupPerms.includes('*') ? ['view_dashboard'] : ['*']);
      return;
    }
    if (groupPerms.includes('*')) {
      const withoutStar = groupPerms.filter((p) => p !== '*');
      setGroupPerms(withoutStar.includes(key) ? withoutStar.filter((p) => p !== key) : [...withoutStar, key]);
      return;
    }
    setGroupPerms(
      groupPerms.includes(key) ? groupPerms.filter((p) => p !== key) : [...groupPerms, key]
    );
  };

  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const filteredGroups = groups.filter((g) => {
    const q = groupSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      g.name.toLowerCase().includes(q) ||
      (g.description || '').toLowerCase().includes(q) ||
      g.permissions.some((p) => p.toLowerCase().includes(q))
    );
  });

  if (viewMode === 'user_form') {
    return (
      <div className="w-full space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--admin-fg)] sm:text-2xl">
              {editingUser ? `Edit Account: ${editingUser.displayName || editingUser.username}` : 'Create Staff Account'}
            </h1>
            <p className="text-xs text-[var(--admin-muted)]">
              {editingUser ? `@${editingUser.username}` : 'Configure credentials and permissions'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {editingUser && isOwner && editingUser.role !== 'owner' && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setTargetOwnerUser(editingUser);
                  setOwnerModalOpen(true);
                }}
                className="text-xs text-amber-400 hover:bg-amber-500/10 flex items-center gap-1.5"
              >
                <StarPlus className="h-4 w-4" />
                Transfer Ownership
              </Button>
            )}

            {editingUser && editingUser.id !== currentUser?.id && editingUser.role !== 'owner' && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleDeleteUser(editingUser)}
                className="text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-1.5"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className="text-xs text-[var(--admin-muted)] hover:text-[var(--admin-fg)] hover:bg-[var(--admin-card)] flex items-center gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Users
            </Button>
          </div>
        </div>

        <form id="user-edit-form" onSubmit={handleSaveUser} className="space-y-6">
          <Card className="bg-[var(--admin-card)]">
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-semibold text-[var(--admin-fg)]">Account Credentials</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--admin-muted)] mb-1">
                    Username
                  </label>
                  <Input
                    required
                    type="text"
                    value={userUsername}
                    onChange={(e) => {
                      setUserUsername(e.target.value);
                      setIsUserFormDirty(true);
                    }}
                    className="bg-[var(--admin-elevated)] text-[var(--admin-fg)]"
                    placeholder="e.g. alex"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--admin-muted)] mb-1">
                    Display Name
                  </label>
                  <Input
                    type="text"
                    value={userDisplayName}
                    onChange={(e) => {
                      setUserDisplayName(e.target.value);
                      setIsUserFormDirty(true);
                    }}
                    className="bg-[var(--admin-elevated)] text-[var(--admin-fg)]"
                    placeholder="e.g. Alex (Lead Moderator)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--admin-muted)] mb-1">
                  {editingUser ? 'New Password (leave empty to keep unchanged)' : 'Password'}
                </label>
                <Input
                  type="password"
                  required={!editingUser}
                  minLength={4}
                  value={userPassword}
                  onChange={(e) => {
                    setUserPassword(e.target.value);
                    setIsUserFormDirty(true);
                  }}
                  className="bg-[var(--admin-elevated)] text-[var(--admin-fg)]"
                  placeholder="Min. 4 characters"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--admin-card)]">
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-semibold text-[var(--admin-fg)]">Role & Division</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--admin-muted)] mb-1">
                    Group / Division
                  </label>
                  <select
                    value={userGroupId ?? ''}
                    onChange={(e) => {
                      setUserGroupId(e.target.value ? Number(e.target.value) : null);
                      setIsUserFormDirty(true);
                    }}
                    className="w-full h-9 rounded-md bg-[var(--admin-elevated)] text-[var(--admin-fg)] px-3 text-xs focus:outline-none"
                  >
                    <option value="">None (Individual permissions)</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--admin-muted)] mb-1">
                    Role Category
                  </label>
                  <select
                    value={userRole}
                    onChange={(e) => {
                      setUserRole(e.target.value as 'owner' | 'admin' | 'member');
                      setIsUserFormDirty(true);
                    }}
                    disabled={editingUser?.role === 'owner' || (userRole === 'owner' && !isOwner)}
                    className="w-full h-9 rounded-md bg-[var(--admin-elevated)] text-[var(--admin-fg)] px-3 text-xs focus:outline-none disabled:opacity-60"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                    {isOwner && <option value="owner">Panel Owner</option>}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--admin-card)]">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--admin-fg)]">Granular System Permissions</h3>
                <span className="text-xs text-[var(--admin-muted)]">
                  {userPerms.includes('*') ? 'All Permissions Granted' : `${userPerms.length} Selected`}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {availablePermissions.map((p) => {
                  const isChecked = userPerms.includes('*') || userPerms.includes(p.key);
                  return (
                    <div
                      key={p.key}
                      onClick={() => toggleUserPerm(p.key)}
                      className={cn(
                        'p-3 rounded-xl cursor-pointer transition-colors flex items-start gap-3 select-none',
                        isChecked ? 'bg-[var(--admin-elevated)]' : 'bg-[var(--admin-elevated)]/40 hover:bg-[var(--admin-elevated)]/70'
                      )}
                    >
                      <div
                        className={cn(
                          'h-4 w-4 rounded shrink-0 flex items-center justify-center mt-0.5 transition-colors',
                          isChecked ? 'bg-[var(--admin-accent)] text-[var(--admin-accent-fg)]' : 'bg-[var(--admin-elevated)]'
                        )}
                      >
                        {isChecked && <Check className="h-3 w-3" />}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[var(--admin-fg)]">{p.label}</p>
                        <p className="text-[11px] text-[var(--admin-muted)]">{p.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {formError ? <p className="text-xs text-rose-400 font-medium">{formError}</p> : null}
        </form>

        <UnsavedChangesBar
          show={viewMode === 'user_form' && isUserFormDirty}
          isSaving={submitting}
          message={`Careful, you have unsaved changes!`}
          onReset={resetUserFormToInitial}
          onSave={() => {
            const form = document.getElementById('user-edit-form') as HTMLFormElement;
            if (form) form.requestSubmit();
          }}
        />
      </div>
    );
  }

  if (viewMode === 'group_form') {
    return (
      <div className="w-full space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--admin-fg)] sm:text-2xl">
              {editingGroup ? `Edit Group: ${editingGroup.name}` : 'Create Division Group'}
            </h1>
            <p className="text-xs text-[var(--admin-muted)]">Configure division permissions and color</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {editingGroup && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleDeleteGroup(editingGroup)}
                className="text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-1.5"
              >
                <Trash2 className="h-4 w-4" />
                Delete Group
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className="text-xs text-[var(--admin-muted)] hover:text-[var(--admin-fg)] hover:bg-[var(--admin-card)] flex items-center gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Groups
            </Button>
          </div>
        </div>

        <form id="group-edit-form" onSubmit={handleSaveGroup} className="space-y-6">
          <Card className="bg-[var(--admin-card)]">
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-semibold text-[var(--admin-fg)]">Group Information</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--admin-muted)] mb-1">
                    Group Name
                  </label>
                  <Input
                    required
                    type="text"
                    value={groupName}
                    onChange={(e) => {
                      setGroupName(e.target.value);
                      setIsGroupFormDirty(true);
                    }}
                    className="bg-[var(--admin-elevated)] text-[var(--admin-fg)]"
                    placeholder="e.g. Lead Administrators"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--admin-muted)] mb-1">
                    Description
                  </label>
                  <Input
                    type="text"
                    value={groupDesc}
                    onChange={(e) => {
                      setGroupDesc(e.target.value);
                      setIsGroupFormDirty(true);
                    }}
                    className="bg-[var(--admin-elevated)] text-[var(--admin-fg)]"
                    placeholder="e.g. Division responsible for bot settings and moderation"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--admin-muted)] mb-2">
                  Badge Color
                </label>
                <div className="flex flex-wrap gap-2.5 items-center">
                  {presetColors.map((c) => (
                    <button
                      type="button"
                      key={c.value}
                      onClick={() => {
                        setGroupColor(c.value);
                        setIsGroupFormDirty(true);
                      }}
                      className={cn(
                        'h-8 w-8 rounded-full transition-transform flex items-center justify-center',
                        groupColor === c.value ? 'scale-110 ring-2 ring-white/50' : 'hover:scale-105'
                      )}
                      style={{ backgroundColor: c.value }}
                    >
                      {groupColor === c.value && <Check className="h-4 w-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--admin-card)]">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--admin-fg)]">Default Division Permissions</h3>
                <span className="text-xs text-[var(--admin-muted)]">
                  {groupPerms.includes('*') ? 'All Permissions Granted' : `${groupPerms.length} Selected`}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {availablePermissions.map((p) => {
                  const isChecked = groupPerms.includes('*') || groupPerms.includes(p.key);
                  return (
                    <div
                      key={p.key}
                      onClick={() => toggleGroupPerm(p.key)}
                      className={cn(
                        'p-3 rounded-xl cursor-pointer transition-colors flex items-start gap-3 select-none',
                        isChecked ? 'bg-[var(--admin-elevated)]' : 'bg-[var(--admin-elevated)]/40 hover:bg-[var(--admin-elevated)]/70'
                      )}
                    >
                      <div
                        className={cn(
                          'h-4 w-4 rounded shrink-0 flex items-center justify-center mt-0.5 transition-colors',
                          isChecked ? 'bg-[var(--admin-accent)] text-[var(--admin-accent-fg)]' : 'bg-[var(--admin-elevated)]'
                        )}
                      >
                        {isChecked && <Check className="h-3 w-3" />}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[var(--admin-fg)]">{p.label}</p>
                        <p className="text-[11px] text-[var(--admin-muted)]">{p.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {formError ? <p className="text-xs text-rose-400 font-medium">{formError}</p> : null}
        </form>

        <UnsavedChangesBar
          show={viewMode === 'group_form' && isGroupFormDirty}
          isSaving={submitting}
          message={editingGroup ? `Careful — unsaved group changes!` : 'Careful — unsaved new group!'}
          onReset={resetGroupFormToInitial}
          onSave={() => {
            const form = document.getElementById('group-edit-form') as HTMLFormElement;
            if (form) form.requestSubmit();
          }}
        />
      </div>
    );
  }

  if (loading && viewMode === 'list') {
    return <PanelUsersSkeleton />;
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--admin-fg)] sm:text-2xl">
            Staff & Access Management
          </h1>
          <p className="text-xs text-[var(--admin-muted)] sm:text-sm">
            Manage admin panel users, assigned divisions, and granular system permissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'users' ? (
            <Button
              onClick={openAddUser}
              className="bg-[var(--admin-accent)] text-[var(--admin-accent-fg)] hover:opacity-90 transition-opacity flex items-center gap-2 text-xs font-medium"
            >
              <UserPlus className="h-4 w-4" />
              Add User
            </Button>
          ) : (
            <Button
              onClick={openAddGroup}
              className="bg-[var(--admin-accent)] text-[var(--admin-accent-fg)] hover:opacity-90 transition-opacity flex items-center gap-2 text-xs font-medium"
            >
              <Plus className="h-4 w-4" />
              Create Group
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
        {activeTab === 'users' ? (
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-muted)]" />
            <Input
              type="text"
              placeholder="Search staff accounts..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 pl-9 rounded-lg bg-[var(--admin-card)] text-xs text-[var(--admin-fg)] placeholder:text-[var(--admin-muted)] border-0 shadow-none focus-visible:ring-1 focus-visible:ring-[var(--admin-accent)]"
            />
          </div>
        ) : (
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-muted)]" />
            <Input
              type="text"
              placeholder="Search groups & divisions..."
              value={groupSearchQuery}
              onChange={(e) => setGroupSearchQuery(e.target.value)}
              className="h-9 pl-9 rounded-lg bg-[var(--admin-card)] text-xs text-[var(--admin-fg)] placeholder:text-[var(--admin-muted)] border-0 shadow-none focus-visible:ring-1 focus-visible:ring-[var(--admin-accent)]"
            />
          </div>
        )}

        <div className="flex items-center gap-2 p-1 rounded-full bg-[var(--admin-card)] w-fit self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={cn(
              'relative px-4 py-2 text-xs font-medium rounded-full transition-colors flex items-center gap-2',
              activeTab === 'users'
                ? 'text-[var(--admin-accent-fg)]'
                : 'text-[var(--admin-muted)] hover:text-[var(--admin-fg)]'
            )}
          >
            {activeTab === 'users' && (
              <motion.span
                layoutId="panel-tab-pill"
                className="absolute inset-0 rounded-full bg-[var(--admin-accent)] z-0"
                transition={springSnappy}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users ({users.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('groups')}
            className={cn(
              'relative px-4 py-2 text-xs font-medium rounded-full transition-colors flex items-center gap-2',
              activeTab === 'groups'
                ? 'text-[var(--admin-accent-fg)]'
                : 'text-[var(--admin-muted)] hover:text-[var(--admin-fg)]'
            )}
          >
            {activeTab === 'groups' && (
              <motion.span
                layoutId="panel-tab-pill"
                className="absolute inset-0 rounded-full bg-[var(--admin-accent)] z-0"
                transition={springSnappy}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <FolderGit2 className="h-4 w-4" />
              Groups & Divisions ({groups.length})
            </span>
          </button>
        </div>
      </div>

      {activeTab === 'users' && (
        <Card className="bg-[var(--admin-card)] overflow-hidden rounded-xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[650px]">
                <thead>
                  <tr className="text-left text-xs text-[var(--admin-muted)] border-b border-[var(--admin-border)]">
                    <th className="pt-4 pb-3 pl-5 sm:pl-6 pr-4 font-semibold">User</th>
                    <th className="pt-4 pb-3 px-4 font-semibold">Role</th>
                    <th className="pt-4 pb-3 px-4 font-semibold">Group / Division</th>
                    <th className="pt-4 pb-3 px-4 font-semibold">Permissions</th>
                    <th className="pt-4 pb-3 pr-5 sm:pr-6 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                {listReveal ? (
                  <motion.tbody variants={staggerContainer} initial="hidden" animate="show" key={currentPage + '-' + pageSize}>
                    {paginatedUsers.map((u) => (
                      <motion.tr
                        key={u.id}
                        variants={listItem}
                        onClick={() => openEditUser(u)}
                        className="border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-elevated)] transition-colors cursor-pointer"
                      >
                        <UserRowContent
                          u={u}
                          currentUser={currentUser}
                          isOwner={isOwner}
                          onEdit={() => openEditUser(u)}
                          onTransfer={() => {
                            setTargetOwnerUser(u);
                            setOwnerModalOpen(true);
                          }}
                          onDelete={() => handleDeleteUser(u)}
                        />
                      </motion.tr>
                    ))}
                  </motion.tbody>
                ) : (
                  <tbody key={currentPage + '-' + pageSize}>
                    {paginatedUsers.map((u) => (
                      <tr
                        key={u.id}
                        onClick={() => openEditUser(u)}
                        className="border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-elevated)] transition-colors cursor-pointer"
                      >
                        <UserRowContent
                          u={u}
                          currentUser={currentUser}
                          isOwner={isOwner}
                          onEdit={() => openEditUser(u)}
                          onTransfer={() => {
                            setTargetOwnerUser(u);
                            setOwnerModalOpen(true);
                          }}
                          onDelete={() => handleDeleteUser(u)}
                        />
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>

            <TablePagination
              totalItems={filteredUsers.length}
              pageSize={pageSize}
              setPageSize={setPageSize}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
            />
          </CardContent>
        </Card>
      )}

      {activeTab === 'groups' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.length === 0 ? (
            <p className="col-span-full py-12 text-center text-sm text-[var(--admin-muted)]">
              No groups or divisions match your search.
            </p>
          ) : (
            filteredGroups.map((g) => (
              <Card
                key={g.id}
                className="bg-[var(--admin-card)] rounded-xl border-0 shadow-none p-0 gap-0 overflow-hidden flex flex-col justify-between"
              >
                <CardContent className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: g.color || '#3b82f6' }}
                        />
                        <h3 className="text-base font-semibold text-[var(--admin-fg)] truncate" title={g.name}>
                          {g.name}
                        </h3>
                      </div>
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[var(--admin-elevated)] text-[var(--admin-muted)] shrink-0">
                        {g.memberCount} {g.memberCount === 1 ? 'member' : 'members'}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--admin-muted)] line-clamp-2">
                      {g.description || 'No description provided for this division.'}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {g.permissions.includes('*') ? (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">
                          Full Access (*)
                        </span>
                      ) : (
                        g.permissions.slice(0, 4).map((p) => (
                          <span
                            key={p}
                            className="text-[10px] font-medium px-2 py-0.5 rounded bg-[var(--admin-elevated)] text-[var(--admin-fg)]"
                          >
                            {p}
                          </span>
                        ))
                      )}
                      {g.permissions.length > 4 && !g.permissions.includes('*') && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--admin-elevated)] text-[var(--admin-muted)]">
                          +{g.permissions.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex items-center justify-between border-t border-[var(--admin-border)] px-5 py-2.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditGroup(g)}
                    className="h-8 gap-1.5 px-2 text-xs font-medium text-[var(--admin-accent)] hover:text-[var(--admin-accent)] hover:bg-[var(--admin-elevated)] border-0 shadow-none"
                  >
                    <span>Edit Group</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteGroup(g)}
                    className="h-8 gap-1.5 px-2 text-xs text-rose-400 hover:bg-rose-500/10 hover:text-red-400 border-0 shadow-none"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      )}

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {ownerModalOpen && targetOwnerUser && (
              <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/70 backdrop-blur-sm"
                  onClick={() => setOwnerModalOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="relative z-10 w-full max-w-md rounded-2xl bg-[var(--admin-card)] p-6 space-y-4 shadow-2xl"
                >
                  <div className="flex items-center gap-3 text-amber-400">
                    <StarPlus className="h-6 w-6" />
                    <h3 className="text-base font-bold text-[var(--admin-fg)]">
                      Transfer Panel Ownership
                    </h3>
                  </div>

                  <p className="text-xs text-[var(--admin-muted)] leading-relaxed">
                    Are you sure you want to make <strong className="text-[var(--admin-fg)]">{targetOwnerUser.displayName || targetOwnerUser.username}</strong> the new Owner of this admin panel? Your account will be assigned the Admin role.
                  </p>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setOwnerModalOpen(false)}
                      className="text-xs text-[var(--admin-muted)]"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      disabled={submitting}
                      onClick={handleTransferOwnership}
                      className="bg-amber-500 text-black hover:bg-amber-400 text-xs font-semibold"
                    >
                      {submitting ? 'Transferring...' : 'Confirm Ownership Transfer'}
                    </Button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      <ConfirmModal
        open={Boolean(deleteConfirmUser)}
        title="Delete Staff Account?"
        description={
          deleteConfirmUser
            ? `Are you sure you want to permanently remove staff account @${deleteConfirmUser.username}? This account will lose all access.`
            : ''
        }
        confirmText="Delete Account"
        isLoading={deletingLoading}
        onConfirm={executeDeleteUser}
        onClose={() => setDeleteConfirmUser(null)}
      />

      <ConfirmModal
        open={Boolean(deleteConfirmGroup)}
        title="Delete Division Group?"
        description={
          deleteConfirmGroup
            ? `Are you sure you want to delete division group "${deleteConfirmGroup.name}"? Members assigned to this group will lose default group permissions.`
            : ''
        }
        confirmText="Delete Group"
        isLoading={deletingLoading}
        onConfirm={executeDeleteGroup}
        onClose={() => setDeleteConfirmGroup(null)}
      />
    </div>
  );
}

function UserRowContent({
  u,
  currentUser,
  isOwner,
  onEdit,
  onTransfer,
  onDelete,
}: {
  u: PanelUser;
  currentUser?: PanelUser | null;
  isOwner: boolean;
  onEdit: () => void;
  onTransfer: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <td className="py-3.5 pl-5 sm:pl-6 pr-4">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-[var(--admin-fg)]">
              {u.displayName || u.username}
            </span>
            {u.role === 'owner' && <StarPlus className="h-3.5 w-3.5 text-amber-400" />}
          </div>
          <span className="text-xs text-[var(--admin-muted)]">@{u.username}</span>
        </div>
      </td>

      <td className="py-3.5 px-4">
        {u.role === 'owner' ? (
          <span className="text-xs font-bold text-amber-400 inline-flex items-center">
            Owner
          </span>
        ) : u.role === 'admin' ? (
          <span className="text-xs font-semibold text-purple-400">
            Admin
          </span>
        ) : (
          <span className="text-xs font-medium text-[var(--admin-muted)]">
            Member
          </span>
        )}
      </td>

      <td className="py-3.5 px-4">
        {u.groupName ? (
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-full inline-flex items-center gap-1.5"
            style={{
              backgroundColor: `${u.groupColor}20`,
              color: u.groupColor ?? '#a855f7',
            }}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: u.groupColor ?? '#a855f7' }} />
            {u.groupName}
          </span>
        ) : (
          <span className="text-xs text-[var(--admin-muted)]">Unassigned</span>
        )}
      </td>

      <td className="py-3.5 px-4">
        <div className="flex flex-wrap gap-1">
          {u.permissions.includes('*') ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">
              Full Access (*)
            </span>
          ) : (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[var(--admin-elevated)] text-[var(--admin-fg)]">
              {u.permissions.length} {u.permissions.length === 1 ? 'permission' : 'permissions'}
            </span>
          )}
        </div>
      </td>

      <td className="py-3.5 pr-5 sm:pr-6 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="text-xs text-[var(--admin-fg)] hover:bg-[var(--admin-elevated)]"
          >
            Edit
          </Button>

          {isOwner && u.role !== 'owner' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onTransfer}
              className="text-xs text-amber-400 hover:bg-amber-500/10"
              title="Transfer Ownership"
            >
              <StarPlus className="h-3.5 w-3.5" />
            </Button>
          )}

          {u.id !== currentUser?.id && u.role !== 'owner' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-xs text-rose-400 hover:bg-rose-500/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </td>
    </>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { useAuth } from '@/components/auth/auth-context';
import { User, RoleType } from '@/lib/types/database';
import {
  Users as UsersIcon,
  UserPlus,
  Shield,
  Edit2,
  Trash2,
  Lock,
  Mail,
  User as UserLucideIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Eye,
  EyeOff,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

export default function UsersAdminPage() {
  const router = useRouter();
  const { user: currentUser, authFetch } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Formulario Crear
  const [createEmail, setCreateEmail] = useState('');
  const [createFullName, setCreateFullName] = useState('');
  const [createRole, setCreateRole] = useState<RoleType>('gestor');
  const [createPassword, setCreatePassword] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Formulario Editar
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState<RoleType>('gestor');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editPassword, setEditPassword] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/users');
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Error al cargar usuarios.');
      } else {
        setUsers(data.data || []);
      }
    } catch (err: any) {
      setError('Error de conexión al cargar usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setCreateSubmitting(true);

    try {
      const res = await authFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: createEmail,
          full_name: createFullName,
          role: createRole,
          password: createPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Error al crear el usuario.');
      } else {
        setSuccessMsg(`Usuario ${createEmail} creado exitosamente.`);
        setShowCreateModal(false);
        setCreateEmail('');
        setCreateFullName('');
        setCreatePassword('');
        setCreateRole('gestor');
        fetchUsers();
      }
    } catch (err: any) {
      setError('Ocurrió un error inesperado.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditFullName(user.full_name || '');
    setEditRole(user.role);
    setEditIsActive(user.is_active);
    setEditPassword('');
    setError(null);
    setSuccessMsg(null);
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setError(null);
    setSuccessMsg(null);
    setEditSubmitting(true);

    try {
      const body: any = {
        full_name: editFullName,
        role: editRole,
        is_active: editIsActive,
      };
      if (editPassword.trim()) {
        body.password = editPassword.trim();
      }

      const res = await authFetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Error al actualizar usuario.');
      } else {
        setSuccessMsg('Usuario actualizado con éxito.');
        setShowEditModal(false);
        fetchUsers();
      }
    } catch (err: any) {
      setError('Error al conectar con el servidor.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (currentUser?.id === userId) {
      setError('Regla de seguridad: No puede eliminar su propia cuenta de administrador.');
      return;
    }

    if (!confirm(`¿Está seguro de que desea eliminar al usuario ${userEmail}? Esta acción quedará registrada en auditoría.`)) {
      return;
    }

    setError(null);
    setSuccessMsg(null);

    try {
      const res = await authFetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Error al eliminar usuario.');
      } else {
        setSuccessMsg(`Usuario ${userEmail} eliminado correctamente.`);
        fetchUsers();
      }
    } catch (err: any) {
      setError('Error al eliminar usuario.');
    }
  };

  // Verificación de acceso no-admin
  if (!loading && currentUser && currentUser.role !== 'admin') {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <Navbar />
        <main className="p-8 max-w-4xl mx-auto w-full flex-1 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            Acceso Restringido (403 Forbidden)
          </h1>
          <p className="text-sm text-zinc-500 max-w-md">
            Solo los usuarios con rol de <strong>Administrador</strong> tienen permisos para gestionar cuentas de usuario y credenciales del sistema.
          </p>
          <Link
            href="/"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            Volver al Panel Principal
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar />

      <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6 flex-1">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Link href="/" className="hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Panel Principal</span>
          </Link>
          <span>/</span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">Administración de Usuarios</span>
        </div>

        {/* Header con botón Crear */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-3">
              <UsersIcon className="w-8 h-8 text-blue-600" />
              <span>Gestión de Usuarios y Roles (RBAC)</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">
              Administración centralizada de cuentas, control de accesos por rol y seguridad
            </p>
          </div>

          <button
            onClick={() => {
              setError(null);
              setSuccessMsg(null);
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Crear Nuevo Usuario</span>
          </button>
        </div>

        {/* Mensajes de feedback */}
        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-center gap-3 text-rose-700 dark:text-rose-300 text-xs sm:text-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl flex items-center gap-3 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tabla de Usuarios */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-16 text-center text-zinc-400 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              <p className="text-sm font-semibold">Cargando directorio de usuarios...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-500 uppercase tracking-wider text-[11px]">
                    <th className="py-4 px-6">Usuario & Correo</th>
                    <th className="py-4 px-6">Rol de Acceso</th>
                    <th className="py-4 px-6">Estado</th>
                    <th className="py-4 px-6">Fecha Registro</th>
                    <th className="py-4 px-6">Último Acceso</th>
                    <th className="py-4 px-6 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {users.map((u) => {
                    const isSelf = currentUser?.id === u.id;
                    const roleBadge =
                      u.role === 'admin'
                        ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border-blue-200'
                        : u.role === 'gestor'
                        ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-emerald-200'
                        : 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border-purple-200';

                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold flex items-center justify-center text-xs shadow-2xs">
                              {u.full_name
                                ? u.full_name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .slice(0, 2)
                                    .join('')
                                    .toUpperCase()
                                : 'US'}
                            </div>
                            <div>
                              <p className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                <span>{u.full_name || 'Sin nombre'}</span>
                                {isSelf && (
                                  <span className="text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-1.5 py-0.2 rounded-md font-bold">
                                    Tú
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-zinc-500">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-5 px-6">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${roleBadge}`}
                          >
                            <Shield className="w-3.5 h-3.5" />
                            <span className="capitalize">{u.role}</span>
                          </span>
                        </td>

                        <td className="py-5 px-6">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              u.is_active
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600'
                            }`}
                          >
                            {u.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>

                        <td className="py-5 px-6 text-zinc-500 text-xs">
                          {new Date(u.created_at).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>

                        <td className="py-5 px-6 text-zinc-500 text-xs">
                          {u.last_login
                            ? new Date(u.last_login).toLocaleString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Nunca'}
                        </td>

                        <td className="py-5 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditModal(u)}
                              className="p-2 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-xl transition-colors cursor-pointer"
                              title="Editar usuario y rol"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              disabled={isSelf}
                              className={`p-2 rounded-xl transition-colors ${
                                isSelf
                                  ? 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
                                  : 'text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer'
                              }`}
                              title={isSelf ? 'No puede eliminarse a sí mismo' : 'Eliminar usuario'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal Crear Usuario */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-950/60 text-blue-600 rounded-2xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    Crear Nuevo Usuario
                  </h3>
                  <p className="text-xs text-zinc-500">Defina credenciales y nivel de acceso RBAC</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Roberto Carlos Gómez"
                  value={createFullName}
                  onChange={(e) => setCreateFullName(e.target.value)}
                  required
                  className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  placeholder="usuario@csc.com"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  required
                  className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Rol del Sistema (RBAC) *
                </label>
                <select
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value as RoleType)}
                  className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm font-semibold"
                >
                  <option value="gestor">Gestor (Operativa de licitaciones y pagos)</option>
                  <option value="admin">Administrador (Control total del sistema)</option>
                  <option value="visualizador">Visualizador (Solo lectura de catálogos)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Contraseña Segura *
                </label>
                <div className="relative">
                  <input
                    type={showCreatePassword ? 'text' : 'password'}
                    placeholder="Mín. 8 caracteres, 1 mayús, 1 minús, 1 número"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    required
                    className="w-full h-11 pl-4 pr-11 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
                  >
                    {showCreatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">
                  La contraseña se encriptará con bcrypt (12 rondas de salado).
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  {createSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Crear Usuario</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-950/60 text-blue-600 rounded-2xl">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    Editar Usuario
                  </h3>
                  <p className="text-xs text-zinc-500">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Rol del Sistema
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as RoleType)}
                  className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm font-semibold"
                >
                  <option value="gestor">Gestor</option>
                  <option value="admin">Administrador</option>
                  <option value="visualizador">Visualizador</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Estado de la Cuenta
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Nueva Contraseña (Opcional)
                </label>
                <input
                  type="password"
                  placeholder="Dejar en blanco para mantener la actual"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  {editSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Actualizando...</span>
                    </>
                  ) : (
                    <span>Guardar Cambios</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

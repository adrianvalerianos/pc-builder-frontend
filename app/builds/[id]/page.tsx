'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { buildsApi, BuildSummary, TYPE_LABELS } from '@/lib/api';

export default function BuildDetailPage({ params }: { params: { id: string } }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<BuildSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    buildsApi.getSummary(params.id)
      .then((data) => { setSummary(data); setNewName(data.name); })
      .catch(() => router.push('/builds'))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  const handleRename = async () => {
    if (!summary || !newName.trim()) return;
    setSaving(true);
    try {
      await buildsApi.update(summary.id, { name: newName.trim() });
      setSummary({ ...summary, name: newName.trim() });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!summary) return;
    await buildsApi.update(summary.id, { isFavorite: !summary.isFavorite });
    setSummary({ ...summary, isFavorite: !summary.isFavorite });
  };

  const handleDelete = async () => {
    if (!summary || !confirm('¿Eliminar esta build?')) return;
    await buildsApi.delete(summary.id);
    router.push('/builds');
  };

  if (authLoading || loading) {
    return <p className="text-sm text-gray-400 mt-10 text-center">Cargando...</p>;
  }

  if (!summary) return null;

  const orderedTypes = Object.keys(TYPE_LABELS).filter((t) => summary.components[t]);

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="min-w-0">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-gray-500"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditing(false); }}
              />
              <button
                onClick={handleRename}
                disabled={saving}
                className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded hover:bg-gray-700 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button onClick={() => setEditing(false)} className="text-xs text-gray-400 hover:text-gray-600">
                Cancelar
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 truncate">{summary.name}</h1>
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-gray-400 hover:text-gray-600 shrink-0"
              >
                Renombrar
              </button>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Última actualización {new Date(summary.updatedAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleToggleFavorite}
            className={`text-xl ${summary.isFavorite ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`}
            title="Marcar/desmarcar favorito"
          >
            ★
          </button>
          <button
            onClick={handleDelete}
            className="text-xs text-gray-400 hover:text-red-500"
          >
            Eliminar
          </button>
        </div>
      </div>

      {/* Price summary */}
      <div className="border border-gray-200 rounded bg-white p-4 mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">Total estimado</p>
          <p className="text-2xl font-bold text-gray-900">${Number(summary.totalPrice).toFixed(2)}</p>
        </div>
        <p className="text-sm text-gray-400">{summary.componentCount} componente{summary.componentCount !== 1 ? 's' : ''}</p>
      </div>

      {/* Components table */}
      <div className="border border-gray-200 rounded bg-white overflow-hidden mb-6">
        {orderedTypes.length === 0 && (
          <p className="text-sm text-gray-400 p-4">No hay componentes en esta build.</p>
        )}
        {orderedTypes.map((type, idx) => {
          const part = summary.components[type];
          return (
            <div
              key={type}
              className={`flex items-start justify-between px-4 py-3 gap-4 ${
                idx !== orderedTypes.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className="w-24 shrink-0">
                <span className="text-xs font-medium text-gray-400">{TYPE_LABELS[type] ?? type}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{part.brand} {part.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {Object.entries(part.specs as Record<string, any>)
                    .map(([, v]) => v)
                    .join(' · ')}
                </p>
              </div>
              <span className="text-sm font-semibold text-gray-900 shrink-0">
                ${Number(part.price).toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>

      <Link href="/builds" className="text-sm text-gray-400 hover:text-gray-700">
        ← Volver a mis builds
      </Link>
    </div>
  );
}
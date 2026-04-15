'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { buildsApi, Build } from '@/lib/api';

export default function BuildsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    buildsApi.getAll()
      .then(setBuilds)
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  const toggleFavorite = async (build: Build) => {
    const updated = await buildsApi.update(build.id, { isFavorite: !build.isFavorite });
    setBuilds((prev) => prev.map((b) => (b.id === build.id ? updated : b)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta build?')) return;
    await buildsApi.delete(id);
    setBuilds((prev) => prev.filter((b) => b.id !== id));
  };

  if (authLoading || loading) {
    return <p className="text-sm text-gray-400 mt-10 text-center">Cargando...</p>;
  }

  const favorites = builds.filter((b) => b.isFavorite);
  const rest = builds.filter((b) => !b.isFavorite);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Mis builds</h1>
        <Link
          href="/builder"
          className="text-sm bg-gray-900 text-white px-4 py-1.5 rounded hover:bg-gray-700"
        >
          Nueva build
        </Link>
      </div>

      {builds.length === 0 && (
        <div className="text-center mt-20">
          <p className="text-gray-400 text-sm mb-4">Aún no hay builds.</p>
          <Link href="/builder" className="text-sm underline text-gray-600">Comenzar a armar</Link>
        </div>
      )}

      {favorites.length > 0 && (
        <section className="mb-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Favoritos</p>
          <BuildList builds={favorites} onToggleFavorite={toggleFavorite} onDelete={handleDelete} />
        </section>
      )}

      {rest.length > 0 && (
        <section>
          {favorites.length > 0 && (
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Todas las builds</p>
          )}
          <BuildList builds={rest} onToggleFavorite={toggleFavorite} onDelete={handleDelete} />
        </section>
      )}
    </div>
  );
}

function BuildList({
  builds,
  onToggleFavorite,
  onDelete,
}: {
  builds: Build[];
  onToggleFavorite: (b: Build) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      {builds.map((build) => (
        <div
          key={build.id}
          className="flex items-center justify-between border border-gray-200 rounded bg-white px-4 py-3"
        >
          <div className="min-w-0">
            <Link
              href={`/builds/${build.id}`}
              className="text-sm font-medium text-gray-900 hover:underline"
            >
              {build.name}
            </Link>
            <p className="text-xs text-gray-400 mt-0.5">
              {build.components?.length ?? 0} componentes · ${Number(build.totalPrice).toFixed(2)} ·{' '}
              {new Date(build.updatedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-4">
            <button
              onClick={() => onToggleFavorite(build)}
              className={`text-sm ${build.isFavorite ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`}
              title="Marcar/desmarcar favorito"
            >
              ★
            </button>
            <Link
              href={`/builds/${build.id}`}
              className="text-xs text-gray-400 hover:text-gray-700"
            >
              Ver
            </Link>
            <button
              onClick={() => onDelete(build.id)}
              className="text-xs text-gray-400 hover:text-red-500"
            >
              Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { componentsApi, buildsApi, Component, COMPONENT_TYPES, TYPE_LABELS } from '@/lib/api';

export default function BuilderPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [allComponents, setAllComponents] = useState<Record<string, Component[]>>({});
  const [selected, setSelected] = useState<Record<string, Component | null>>({});
  const [modalType, setModalType] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [buildName, setBuildName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadingComponents, setLoadingComponents] = useState(true);
  const [compatNote, setCompatNote] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      try {
        const results = await Promise.all(
          COMPONENT_TYPES.map((type) => componentsApi.getByType(type))
        );
        const map: Record<string, Component[]> = {};
        COMPONENT_TYPES.forEach((type, i) => { map[type] = results[i]; });
        setAllComponents(map);
      } finally {
        setLoadingComponents(false);
      }
    }
    fetchAll();
  }, []);

  const checkCompat = useCallback((next: Record<string, Component | null>) => {
    const cpu = next['cpu'];
    const mb = next['motherboard'];
    if (cpu && mb && (cpu.specs as any)?.socket !== (mb.specs as any)?.socket) {
      setCompatNote('⚠ Los sockets del CPU y la Tarjeta Madre podrían ser incompatibles.');
    } else {
      setCompatNote(null);
    }
  }, []);

  const totalPrice = Object.values(selected).reduce(
    (sum, c) => sum + (c ? Number(c.price) : 0),
    0
  );
  const selectedCount = Object.values(selected).filter(Boolean).length;

  const handleSelect = (component: Component) => {
    const next = { ...selected, [component.type]: component };
    setSelected(next);
    checkCompat(next);
    setModalType(null);
    setSearch('');
  };

  const handleRemove = (type: string) => {
    const next = { ...selected };
    delete next[type];
    setSelected(next);
    checkCompat(next);
  };

  const openModal = (type: string) => {
    setSearch('');
    setModalType(type);
  };

  const closeModal = () => {
    setModalType(null);
    setSearch('');
  };

  const handleSave = async () => {
    if (!user) { router.push('/login'); return; }
    if (!buildName.trim()) { setError('Por favor, ingresa un nombre para la build.'); return; }
    if (selectedCount === 0) { setError('Selecciona al menos un componente.'); return; }

    setSaving(true);
    setError('');
    try {
      const componentIds = Object.values(selected)
        .filter(Boolean)
        .map((c) => c!.id);
      const build = await buildsApi.create(buildName.trim(), componentIds);
      router.push(`/builds/${build.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loadingComponents) {
    return <p className="text-sm text-gray-400 mt-10 text-center">Cargando...</p>;
  }

  const modalList = modalType
    ? (allComponents[modalType] ?? []).filter((c) => {
        const q = search.toLowerCase();
        return (
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.brand.toLowerCase().includes(q)
        );
      })
    : [];

  return (
    <>
      <div className="flex gap-6">
        {/* Left — slot list */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Armador</h1>

          {compatNote && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-4">
              {compatNote}
            </p>
          )}

          <div className="space-y-2">
            {COMPONENT_TYPES.map((type) => {
              const part = selected[type];
              return (
                <div
                  key={type}
                  className="flex items-center justify-between border border-gray-200 rounded bg-white px-4 py-3 gap-4"
                >
                  {/* Type label */}
                  <span className="text-xs font-medium text-gray-400 w-24 shrink-0">
                    {TYPE_LABELS[type]}
                  </span>

                  {/* Selected part info or empty state */}
                  <div className="flex-1 min-w-0">
                    {part ? (
                      <>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {part.brand} {part.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {Object.entries(part.specs)
                            .slice(0, 3)
                            .map(([, v]) => `${v}`)
                            .join(' · ')}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-300">Ningún componente seleccionado</p>
                    )}
                  </div>

                  {/* Price + actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    {part && (
                      <span className="text-sm font-semibold text-gray-900">
                        ${Number(part.price).toFixed(2)}
                      </span>
                    )}
                    <button
                      onClick={() => openModal(type)}
                      className="text-xs border border-gray-300 text-gray-700 px-3 py-1 rounded hover:border-gray-500 hover:text-gray-900 transition-colors"
                    >
                      {part ? 'Cambiar' : '+ Agregar'}
                    </button>
                    {part && (
                      <button
                        onClick={() => handleRemove(type)}
                        className="text-xs text-gray-300 hover:text-red-400 transition-colors"
                        title="Quitar"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right — summary sidebar */}
        <div className="w-64 shrink-0">
          <div className="sticky top-6 border border-gray-200 rounded bg-white p-4 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Tu Build</h2>

            <div className="space-y-1.5">
              {COMPONENT_TYPES.map((type) => {
                const part = selected[type];
                return (
                  <div key={type} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-400 w-20 shrink-0">{TYPE_LABELS[type]}</span>
                    {part ? (
                      <span className="text-xs text-gray-700 truncate text-right">{part.name}</span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="border-t border-gray-100 pt-3">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-gray-500">
                  {selectedCount} componente{selectedCount !== 1 ? 's' : ''}
                </span>
                <span className="text-sm font-bold text-gray-900">${totalPrice.toFixed(2)}</span>
              </div>

              <input
                type="text"
                placeholder="Nombre de la build"
                value={buildName}
                onChange={(e) => setBuildName(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-gray-500 mb-2"
              />

              {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-gray-900 text-white py-1.5 rounded text-xs hover:bg-gray-700 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : user ? 'Guardar build' : 'Inicia sesión para guardar'}
              </button>

              {selectedCount > 0 && (
                <button
                  onClick={() => { setSelected({}); setCompatNote(null); }}
                  className="w-full mt-1.5 text-xs text-gray-400 hover:text-gray-600"
                >
                  Limpiar todo
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded border border-gray-200 w-full max-w-lg mx-4 flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">
                Selecciona {TYPE_LABELS[modalType]}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Search */}
            <div className="px-4 py-2 border-b border-gray-100">
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-gray-400"
              />
            </div>

            {/* Component list */}
            <div className="overflow-y-auto flex-1">
              {modalList.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">No se encontraron componentes.</p>
              )}
              {modalList.map((component) => {
                const isSelected = selected[component.type]?.id === component.id;
                return (
                  <button
                    key={component.id}
                    onClick={() => handleSelect(component)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-0 transition-colors ${
                      isSelected
                        ? 'bg-gray-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {component.brand} {component.name}
                          {isSelected && (
                            <span className="ml-2 text-xs text-green-500 font-normal">Seleccionado</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {Object.entries(component.specs)
                            .slice(0, 3)
                            .map(([, v]) => `${v}`)
                            .join(' · ')}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 shrink-0">
                        ${Number(component.price).toFixed(2)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
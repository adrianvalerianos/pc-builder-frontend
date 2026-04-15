import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="mt-20 text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Arma tu PC</h1>
      <p className="text-gray-500 mb-8 max-w-md mx-auto">
        Elige componentes de un catálogo real, ve el precio total al instante y guarda tus builds.
      </p>
      <div className="flex justify-center gap-4">
        <Link
          href="/builder"
          className="bg-gray-900 text-white px-6 py-2.5 rounded hover:bg-gray-700 text-sm"
        >
          Comenzar a armar
        </Link>
        <Link
          href="/builds"
          className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded hover:bg-gray-50 text-sm"
        >
          Mis builds
        </Link>
      </div>

      <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto text-left">
        {[
          { label: 'Catálogo de componentes', desc: 'CPUs, GPUs, RAM, almacenamiento y más de marcas reales.' },
          { label: 'Precio total en vivo', desc: 'Tu presupuesto estimado se actualiza conforme eliges las piezas.' },
          { label: 'Guardar y editar', desc: 'Guarda tus builds, márcalos como favoritos y revísalos cuando quieras.' },
        ].map((item) => (
          <div key={item.label} className="p-4 border border-gray-200 rounded bg-white">
            <p className="text-sm font-medium text-gray-900 mb-1">{item.label}</p>
            <p className="text-xs text-gray-500">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
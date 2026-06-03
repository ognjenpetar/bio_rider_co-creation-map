import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { parseGeoJSON } from '../../lib/import/parseGeoJSON';
import { parseGPX } from '../../lib/import/parseGPX';
import { parseDXF } from '../../lib/import/parseDXF';
import { createLocation } from '../../lib/api/locations';
import { createRoute } from '../../lib/api/routes';
import { createZone } from '../../lib/api/zones';
import type { ImportedItem } from '../../lib/import/types';

type Format = 'geojson' | 'gpx' | 'dxf';

interface ImportModalProps {
  username: string;
  onClose: () => void;
  onImported: () => void;
}

const FORMAT_CONFIG: Record<Format, { label: string; accept: string; color: string; icon: string }> = {
  geojson: {
    label: 'GeoJSON',
    accept: '.geojson,.json',
    color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-300',
    icon: '{}',
  },
  gpx: {
    label: 'GPX',
    accept: '.gpx',
    color: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-300',
    icon: '⛳',
  },
  dxf: {
    label: 'DXF / DWG',
    accept: '.dxf,.dwg',
    color: 'bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-300',
    icon: '⬡',
  },
};

type Step = 'pick' | 'preview' | 'importing' | 'done';

export function ImportModal({ username, onClose, onImported }: ImportModalProps) {
  const [step, setStep] = useState<Step>('pick');
  const [items, setItems] = useState<ImportedItem[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const [progress, setProgress] = useState(0);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeFormatRef = useRef<Format>('geojson');

  const locCount = items.filter(i => i.kind === 'location').length;
  const routeCount = items.filter(i => i.kind === 'route').length;
  const zoneCount = items.filter(i => i.kind === 'zone').length;

  function openPicker(format: Format) {
    activeFormatRef.current = format;
    if (fileInputRef.current) {
      fileInputRef.current.accept = FORMAT_CONFIG[format].accept;
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const text = await file.text();
    const format = activeFormatRef.current;

    const result =
      format === 'geojson' ? parseGeoJSON(text) :
      format === 'gpx'     ? parseGPX(text) :
                             parseDXF(text);

    setItems(result.items);
    setWarnings(result.warnings);
    setStep('preview');
  }

  async function doImport() {
    setStep('importing');
    setProgress(0);
    const errors: string[] = [];
    let counter = { location: 1, route: 1, zone: 1 };

    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      try {
        if (item.kind === 'location') {
          await createLocation({
            name: `Uvezena lokacija ${counter.location++}`,
            latitude: item.lat,
            longitude: item.lng,
            created_by: username,
          });
        } else if (item.kind === 'route') {
          await createRoute({
            name: `Uvezena ruta ${counter.route++}`,
            waypoints: item.waypoints,
            created_by: username,
            route_type: 'other',
          });
        } else if (item.kind === 'zone') {
          await createZone({
            name: `Uvezena zona ${counter.zone++}`,
            vertices: item.vertices,
            created_by: username,
            zone_type: 'other',
          });
        }
      } catch (err) {
        errors.push(`Stavka ${idx + 1} (${item.kind}): ${err instanceof Error ? err.message : 'greška'}`);
      }
      setProgress(Math.round(((idx + 1) / items.length) * 100));
    }

    setImportErrors(errors);
    setStep('done');
    onImported();
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={step !== 'importing' ? onClose : undefined}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 bg-gradient-to-br from-indigo-50 to-white">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Uvezi geometriju</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Samo geometrija — atributi ostaju prazni za kasniji unos
            </p>
          </div>
          {step !== 'importing' && (
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="px-6 pb-6">
          {/* ── Step: pick format ── */}
          <AnimatePresence mode="wait">
            {step === 'pick' && (
              <motion.div key="pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-sm text-gray-600 mb-4">Izaberite format fajla za uvoz:</p>
                <div className="space-y-3">
                  {(Object.keys(FORMAT_CONFIG) as Format[]).map(fmt => {
                    const cfg = FORMAT_CONFIG[fmt];
                    return (
                      <button
                        key={fmt}
                        onClick={() => openPicker(fmt)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${cfg.color}`}
                      >
                        <span className="text-lg w-7 text-center">{cfg.icon}</span>
                        <div className="text-left">
                          <div className="font-semibold">{cfg.label}</div>
                          <div className="text-xs opacity-70 font-normal">
                            {fmt === 'geojson' && 'Tačke, linije, poligoni (.geojson, .json)'}
                            {fmt === 'gpx'     && 'Waypointi, tragovi, rute GPS uređaja (.gpx)'}
                            {fmt === 'dxf'     && 'AutoCAD crteži — izvezite DXF iz DWG fajla (.dxf)'}
                          </div>
                        </div>
                        <svg className="w-4 h-4 ml-auto opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ── Step: preview ── */}
            {step === 'preview' && (
              <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex items-center gap-2 mb-4">
                  <button onClick={() => setStep('pick')} className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Nazad
                  </button>
                  <span className="text-xs text-gray-400 truncate">{fileName}</span>
                </div>

                {/* Warnings */}
                {warnings.length > 0 && (
                  <div className="mb-4 space-y-1.5">
                    {warnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                        <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                        {w}
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary */}
                {items.length > 0 ? (
                  <>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[
                        { label: 'Lokacije', count: locCount, color: 'bg-green-50 text-green-700 border-green-200' },
                        { label: 'Rute', count: routeCount, color: 'bg-blue-50 text-blue-700 border-blue-200' },
                        { label: 'Zone', count: zoneCount, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
                      ].map(s => (
                        <div key={s.label} className={`flex flex-col items-center py-3 rounded-xl border ${s.color}`}>
                          <span className="text-2xl font-bold">{s.count}</span>
                          <span className="text-xs font-medium mt-0.5">{s.label}</span>
                        </div>
                      ))}
                    </div>

                    <p className="text-xs text-gray-500 mb-4">
                      Svaka stavka dobija privremeni naziv (npr. "Uvezena lokacija 1") koji možete
                      izmeniti naknadno. Opis, fotografije i ostali atributi ostaju prazni.
                    </p>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setStep('pick')}
                        className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors text-sm"
                      >
                        Odustani
                      </button>
                      <button
                        onClick={doImport}
                        className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors text-sm"
                      >
                        Uvezi {items.length} stavk{items.length === 1 ? 'u' : items.length < 5 ? 'e' : 'i'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Nisu pronađene geometrije za uvoz.
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Step: importing ── */}
            {step === 'importing' && (
              <motion.div key="importing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="py-4 text-center">
                  <p className="text-sm font-medium text-gray-700 mb-4">Uvoz u toku...</p>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <motion.div
                      className="bg-indigo-500 h-3 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ ease: 'linear' }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">{progress}% završeno</p>
                </div>
              </motion.div>
            )}

            {/* ── Step: done ── */}
            {step === 'done' && (
              <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="text-center py-2">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-base font-semibold text-gray-900 mb-1">Uvoz završen</p>
                  <p className="text-sm text-gray-500 mb-4">
                    {items.length - importErrors.length} od {items.length} stavk
                    {items.length === 1 ? 'e' : 'i'} uspešno uvezeno.
                  </p>
                  {importErrors.length > 0 && (
                    <div className="mb-4 text-left space-y-1">
                      {importErrors.map((e, i) => (
                        <div key={i} className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">{e}</div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mb-4">
                    Kliknite na uvezenu stavku na mapi da biste je uredili (naziv, opis, fotografije).
                  </p>
                  <button
                    onClick={onClose}
                    className="w-full px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors text-sm"
                  >
                    Zatvori
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={onFileSelected}
        />
      </motion.div>
    </div>
  );
}

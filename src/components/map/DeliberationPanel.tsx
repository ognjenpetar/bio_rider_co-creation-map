import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import {
  getDeliberations, createDeliberation, updateDeliberationPhase,
  getEntries, addEntry, voteEntry,
} from '../../lib/api/deliberations';
import type { Deliberation, DeliberationEntry, DeliberationPhase, EntryType } from '../../types';

interface DeliberationPanelProps {
  locationId: string;
  locationName: string;
  onClose: () => void;
}

const phaseConfig: Record<DeliberationPhase, { color: string; icon: string; allowedTypes: EntryType[] }> = {
  identification: { color: 'red', icon: '&#128270;', allowedTypes: ['problem', 'comment'] },
  proposals: { color: 'blue', icon: '&#128161;', allowedTypes: ['proposal', 'comment'] },
  argumentation: { color: 'amber', icon: '&#9878;', allowedTypes: ['argument_for', 'argument_against', 'comment'] },
  consensus: { color: 'green', icon: '&#129309;', allowedTypes: ['consensus', 'comment'] },
  closed: { color: 'gray', icon: '&#128274;', allowedTypes: [] },
};

const phaseOrder: DeliberationPhase[] = ['identification', 'proposals', 'argumentation', 'consensus', 'closed'];

export function DeliberationPanel({ locationId, locationName, onClose }: DeliberationPanelProps) {
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();
  const [deliberations, setDeliberations] = useState<Deliberation[]>([]);
  const [selectedDelib, setSelectedDelib] = useState<Deliberation | null>(null);
  const [entries, setEntries] = useState<DeliberationEntry[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newEntryType, setNewEntryType] = useState<EntryType>('comment');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getDeliberations(locationId).then(setDeliberations).catch(() => {});
  }, [locationId]);

  useEffect(() => {
    if (selectedDelib) {
      getEntries(selectedDelib.id).then(setEntries).catch(() => {});
    }
  }, [selectedDelib]);

  const handleCreate = async () => {
    if (!newTitle.trim() || !user?.username) return;
    setLoading(true);
    try {
      const delib = await createDeliberation({
        location_id: locationId,
        title: newTitle.trim(),
        created_by: user.username,
      });
      setDeliberations(prev => [delib, ...prev]);
      setNewTitle('');
      setShowCreateForm(false);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const handleAdvancePhase = async () => {
    if (!selectedDelib || !isAdmin) return;
    const currentIdx = phaseOrder.indexOf(selectedDelib.phase);
    if (currentIdx < phaseOrder.length - 1) {
      const nextPhase = phaseOrder[currentIdx + 1];
      await updateDeliberationPhase(selectedDelib.id, nextPhase);
      setSelectedDelib({ ...selectedDelib, phase: nextPhase });
      setDeliberations(prev => prev.map(d => d.id === selectedDelib.id ? { ...d, phase: nextPhase } : d));
    }
  };

  const handleAddEntry = async () => {
    if (!newContent.trim() || !selectedDelib || !user?.username) return;
    setLoading(true);
    try {
      const entry = await addEntry({
        deliberation_id: selectedDelib.id,
        username: user.username,
        entry_type: newEntryType,
        content: newContent.trim(),
      });
      setEntries(prev => [...prev, entry]);
      setNewContent('');
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const handleVote = async (entryId: string, voteType: 'up' | 'down') => {
    if (!user?.username) return;
    await voteEntry(entryId, user.username, voteType);
    // Refresh entries
    if (selectedDelib) {
      getEntries(selectedDelib.id).then(setEntries).catch(() => {});
    }
  };

  const entryTypeLabel = (type: EntryType) => {
    const map: Record<EntryType, { label: string; color: string }> = {
      problem: { label: t('deliberation.problem'), color: 'bg-red-100 text-red-700' },
      proposal: { label: t('deliberation.proposal'), color: 'bg-blue-100 text-blue-700' },
      argument_for: { label: t('deliberation.argumentFor'), color: 'bg-green-100 text-green-700' },
      argument_against: { label: t('deliberation.argumentAgainst'), color: 'bg-orange-100 text-orange-700' },
      consensus: { label: t('deliberation.consensus'), color: 'bg-emerald-100 text-emerald-700' },
      comment: { label: t('deliberation.comment'), color: 'bg-gray-100 text-gray-700' },
    };
    return map[type] || map.comment;
  };

  // List view
  if (!selectedDelib) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 w-80 max-h-[500px] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">{t('deliberation.title')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-3">{locationName}</p>

        {deliberations.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">{t('deliberation.noDeliberations')}</p>
        ) : (
          <div className="space-y-2 mb-4">
            {deliberations.map(d => {
              const config = phaseConfig[d.phase];
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedDelib(d)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span dangerouslySetInnerHTML={{ __html: config.icon }} />
                    <span className="font-medium text-sm text-gray-900 truncate">{d.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-${config.color}-100 text-${config.color}-700`}>
                      {t(`deliberation.phase.${d.phase}`)}
                    </span>
                    <span className="text-xs text-gray-400">{d.created_by}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {showCreateForm ? (
          <div className="space-y-2">
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder={t('deliberation.titlePlaceholder')}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowCreateForm(false)} className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm">
                {t('common.cancel')}
              </button>
              <button onClick={handleCreate} disabled={loading} className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm disabled:opacity-50">
                {t('deliberation.create')}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors"
          >
            + {t('deliberation.startNew')}
          </button>
        )}
      </motion.div>
    );
  }

  // Detail view
  const currentConfig = phaseConfig[selectedDelib.phase];
  const allowedTypes = currentConfig.allowedTypes;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 w-96 max-h-[600px] overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <button onClick={() => setSelectedDelib(null)} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="font-semibold text-gray-900 flex-1 truncate">{selectedDelib.title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Phase progress */}
      <div className="flex items-center gap-1 mb-4">
        {phaseOrder.map((phase, i) => {
          const isActive = phaseOrder.indexOf(selectedDelib.phase) >= i;
          return (
            <div key={phase} className="flex items-center flex-1">
              <div className={`h-1.5 flex-1 rounded-full ${isActive ? `bg-${phaseConfig[phase].color}-500` : 'bg-gray-200'}`} />
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between mb-4">
        <span className={`text-xs px-2 py-1 rounded-full bg-${currentConfig.color}-100 text-${currentConfig.color}-700 font-medium`}>
          <span dangerouslySetInnerHTML={{ __html: currentConfig.icon }} /> {t(`deliberation.phase.${selectedDelib.phase}`)}
        </span>
        {isAdmin && selectedDelib.phase !== 'closed' && (
          <button
            onClick={handleAdvancePhase}
            className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
          >
            {t('deliberation.advancePhase')} &rarr;
          </button>
        )}
      </div>

      {/* Entries */}
      <div className="space-y-3 mb-4">
        <AnimatePresence>
          {entries.map(entry => {
            const typeInfo = entryTypeLabel(entry.entry_type);
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg border border-gray-100 bg-gray-50"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${typeInfo.color}`}>{typeInfo.label}</span>
                  <span className="text-xs text-gray-500">{entry.username}</span>
                </div>
                <p className="text-sm text-gray-800">{entry.content}</p>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => handleVote(entry.id, 'up')}
                    className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700"
                  >
                    &#9650; {entry.votes_up}
                  </button>
                  <button
                    onClick={() => handleVote(entry.id, 'down')}
                    className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                  >
                    &#9660; {entry.votes_down}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {entries.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">{t('deliberation.noEntries')}</p>
        )}
      </div>

      {/* Add entry form */}
      {allowedTypes.length > 0 && (
        <div className="border-t pt-3 space-y-2">
          <div className="flex gap-1 flex-wrap">
            {allowedTypes.map(type => {
              const typeInfo = entryTypeLabel(type);
              return (
                <button
                  key={type}
                  onClick={() => setNewEntryType(type)}
                  className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                    newEntryType === type ? typeInfo.color + ' ring-1 ring-current' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {typeInfo.label}
                </button>
              );
            })}
          </div>
          <textarea
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            placeholder={t('deliberation.contentPlaceholder')}
            className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
            rows={2}
          />
          <button
            onClick={handleAddEntry}
            disabled={loading || !newContent.trim()}
            className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
          >
            {t('deliberation.addEntry')}
          </button>
        </div>
      )}
    </motion.div>
  );
}

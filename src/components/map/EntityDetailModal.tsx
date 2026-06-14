import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

// Location
import { getComments, addComment, deleteComment, getCommentImageUrl } from '../../lib/api/comments';
import { voteLocation, removeVote, getUserVote, getLocationVoteCounts } from '../../lib/api/votes';
// Route
import { getRouteComments, addRouteComment, deleteRouteComment } from '../../lib/api/routeComments';
import { voteRoute, removeRouteVote, getUserRouteVote, getRouteVoteCounts } from '../../lib/api/routeVotes';
// Zone
import { getZoneComments, addZoneComment, deleteZoneComment } from '../../lib/api/zoneComments';
import { voteZone, removeZoneVote, getUserZoneVote, getZoneVoteCounts } from '../../lib/api/zoneVotes';

import { deleteLocation, updateLocation, uploadLocationImages, uploadLocationDocuments, getLocationImages, getLocationDocuments, deleteLocationImage, deleteLocationDocument } from '../../lib/api/locations';
import { deleteRoute, updateRoute } from '../../lib/api/routes';
import { deleteZone, updateZone } from '../../lib/api/zones';
import { getStorageUrl, STORAGE_BUCKETS } from '../../lib/supabase';
import { getRouteImages, getRouteDocuments, uploadRouteImages, uploadRouteDocuments, deleteRouteImage, deleteRouteDocument, type RouteImage, type RouteDocument } from '../../lib/api/routeMedia';
import { getZoneImages, getZoneDocuments, uploadZoneImages, uploadZoneDocuments, deleteZoneImage, deleteZoneDocument, type ZoneImage, type ZoneDocument } from '../../lib/api/zoneMedia';

import { StarRating } from './StarRating';
import { CommentSkeletonList } from './SkeletonLoader';
import { DeliberationPanel } from './DeliberationPanel';
import { LOCATION_CATEGORIES, getCategoryDef } from '../../lib/locationCategories';
import type { Location, Route, Zone, LocationImage, LocationDocument } from '../../types';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SelectedEntity =
  | { type: 'location'; data: Location }
  | { type: 'route'; data: Route }
  | { type: 'zone'; data: Zone };

interface Comment {
  id: string;
  username: string;
  comment: string | null;
  rating: number;
  created_at: string;
  image_storage_path?: string | null;
  image_file_name?: string | null;
}

interface EntityDetailModalProps {
  entity: SelectedEntity;
  onClose: () => void;
  onEditLocation?: (location: Location) => void;
  onDeleted?: () => void;
  onUpdated?: () => void;
}

type TabId = 'info' | 'glasanje' | 'komentari' | 'diskusija';

// ── Constants ─────────────────────────────────────────────────────────────────

const ROUTE_TYPE_ICONS: Record<string, string> = {
  cycling: '🚲', walking: '🚶', hiking: '🥾', biotop: '🌿', other: '📍',
};
const ZONE_TYPE_LABELS: Record<string, string> = {
  park: '🌳 Park', cycling: '🚲 Cycling Zone', restricted: '⚠️ Restricted',
  residential: '🏠 Residential', commercial: '🏪 Commercial', biotop: '🌿 Biotop', other: '📍 Zone',
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

// ── Shared media sub-components ───────────────────────────────────────────────

interface AnyImage { id: string; storage_path: string; file_name: string; }
interface AnyDocument { id: string; storage_path: string; file_name: string; }

function MediaViewSection({ images, documents }: { images: AnyImage[]; documents: AnyDocument[] }) {
  if (images.length === 0 && documents.length === 0) return null;
  return (
    <>
      {images.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">📷 Fotografije ({images.length})</p>
          <div className="grid grid-cols-3 gap-2">
            {images.map(img => (
              <a key={img.id} href={getStorageUrl(STORAGE_BUCKETS.IMAGES, img.storage_path)} target="_blank" rel="noopener noreferrer">
                <img src={getStorageUrl(STORAGE_BUCKETS.IMAGES, img.storage_path)} alt={img.file_name}
                  className="w-full h-20 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity" />
              </a>
            ))}
          </div>
        </div>
      )}
      {documents.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">📄 Dokumenti ({documents.length})</p>
          <div className="space-y-1.5">
            {documents.map(doc => (
              <a key={doc.id} href={getStorageUrl(STORAGE_BUCKETS.DOCUMENTS, doc.storage_path)} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2 text-sm text-blue-600 hover:underline transition-colors">
                📄 {doc.file_name}
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

interface MediaEditSectionProps {
  images: AnyImage[];
  documents: AnyDocument[];
  newImages: File[];
  newDocuments: File[];
  canEdit: boolean;
  imgInputRef: React.RefObject<HTMLInputElement>;
  docInputRef: React.RefObject<HTMLInputElement>;
  onAddImages: (files: File[]) => void;
  onRemoveNewImage: (i: number) => void;
  onAddDocuments: (files: File[]) => void;
  onRemoveNewDocument: (i: number) => void;
  onDeleteImage: (id: string, path: string) => Promise<void>;
  onDeleteDocument: (id: string, path: string) => Promise<void>;
}

function MediaEditSection({ images, documents, newImages, newDocuments, canEdit, imgInputRef, docInputRef,
  onAddImages, onRemoveNewImage, onAddDocuments, onRemoveNewDocument, onDeleteImage, onDeleteDocument }: MediaEditSectionProps) {
  return (
    <>
      {/* Existing images */}
      {images.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Postojeće fotografije</label>
          <div className="flex flex-wrap gap-2">
            {images.map(img => (
              <div key={img.id} className="relative group">
                <img src={getStorageUrl(STORAGE_BUCKETS.IMAGES, img.storage_path)} alt={img.file_name}
                  className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                {canEdit && (
                  <button type="button" onClick={() => onDeleteImage(img.id, img.storage_path)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add new images */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Dodaj fotografije</label>
        <input ref={imgInputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => onAddImages(Array.from(e.target.files || []))} />
        <button type="button" onClick={() => imgInputRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-300 rounded-xl py-3 text-sm text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors">
          📷 Klikni za odabir fotografija
        </button>
        {newImages.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {newImages.map((f, i) => (
              <div key={i} className="relative group">
                <img src={URL.createObjectURL(f)} alt="" className="w-16 h-16 object-cover rounded-lg border border-green-200" />
                <button type="button" onClick={() => onRemoveNewImage(i)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Existing documents */}
      {documents.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Postojeći dokumenti</label>
          <div className="space-y-1.5">
            {documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                <a href={getStorageUrl(STORAGE_BUCKETS.DOCUMENTS, doc.storage_path)} target="_blank" rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate flex-1">📄 {doc.file_name}</a>
                {canEdit && (
                  <button type="button" onClick={() => onDeleteDocument(doc.id, doc.storage_path)}
                    className="ml-2 text-red-400 hover:text-red-600 text-xs flex-shrink-0">Obriši</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add new documents */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Dodaj dokumente</label>
        <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx" multiple className="hidden"
          onChange={e => onAddDocuments(Array.from(e.target.files || []))} />
        <button type="button" onClick={() => docInputRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-300 rounded-xl py-3 text-sm text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors">
          📄 Klikni za odabir dokumenata (PDF, DOC)
        </button>
        {newDocuments.length > 0 && (
          <div className="space-y-1.5 mt-2">
            {newDocuments.map((f, i) => (
              <div key={i} className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2 text-sm">
                <span className="truncate text-gray-700">📄 {f.name}</span>
                <button type="button" onClick={() => onRemoveNewDocument(i)}
                  className="ml-2 text-red-400 hover:text-red-600 text-xs flex-shrink-0">×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function entityTypeLabel(entity: SelectedEntity): { icon: string; label: string; color: string } {
  if (entity.type === 'route') return { icon: ROUTE_TYPE_ICONS[entity.data.route_type] || '📍', label: 'Ruta', color: 'blue' };
  if (entity.type === 'zone') return { icon: '📐', label: 'Zona', color: 'purple' };
  return { icon: '📌', label: 'Lokacija', color: 'green' };
}

// ── Main component ────────────────────────────────────────────────────────────

export function EntityDetailModal({ entity, onClose, onDeleted, onUpdated }: EntityDetailModalProps) {
  const { t, i18n } = useTranslation();
  const { user, isAdmin } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<TabId>('info');

  // Vote state
  const [voteCounts, setVoteCounts] = useState({ up: 0, down: 0 });
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  // Comment state
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);

  // Inline edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDescEn, setEditDescEn] = useState('');
  const [editDescSr, setEditDescSr] = useState('');
  const [editCategory, setEditCategory] = useState('other');
  const [editLocColor, setEditLocColor] = useState('#6b7280');
  const [editRouteType, setEditRouteType] = useState<'cycling' | 'walking' | 'hiking' | 'biotop' | 'other'>('cycling');
  const [editRouteCategory, setEditRouteCategory] = useState('other');
  const [editZoneType, setEditZoneType] = useState<'park' | 'cycling' | 'restricted' | 'residential' | 'commercial' | 'biotop' | 'other'>('other');
  const [editZoneCategory, setEditZoneCategory] = useState('other');
  const [editColor, setEditColor] = useState('#22c55e');
  const [editFillColor, setEditFillColor] = useState('#a5b4fc');
  const [editDistKm, setEditDistKm] = useState('');
  const [editTimeMin, setEditTimeMin] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Images & documents (all entity types)
  const [locImages, setLocImages] = useState<LocationImage[]>([]);
  const [locDocuments, setLocDocuments] = useState<LocationDocument[]>([]);
  const [routeImages, setRouteImages] = useState<RouteImage[]>([]);
  const [routeDocuments, setRouteDocuments] = useState<RouteDocument[]>([]);
  const [zoneImages, setZoneImages] = useState<ZoneImage[]>([]);
  const [zoneDocuments, setZoneDocuments] = useState<ZoneDocument[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newDocuments, setNewDocuments] = useState<File[]>([]);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const entityId = entity.data.id;
  const entityType = entity.type;

  // Reset tab and edit state when entity changes
  useEffect(() => {
    setActiveTab('info');
    setIsEditing(false);
    setNewImages([]);
    setNewDocuments([]);
  }, [entityId]);

  // ── Load votes & comments ───────────────────────────────────────────────────

  const loadVotes = useCallback(async () => {
    try {
      let counts: { up: number; down: number };
      if (entityType === 'location') counts = await getLocationVoteCounts(entityId);
      else if (entityType === 'route') counts = await getRouteVoteCounts(entityId);
      else counts = await getZoneVoteCounts(entityId);
      setVoteCounts(counts);
    } catch { /* silent */ }

    if (user?.username) {
      try {
        let v: 'up' | 'down' | null = null;
        if (entityType === 'location') v = await getUserVote(entityId, user.username);
        else if (entityType === 'route') v = await getUserRouteVote(entityId, user.username);
        else v = await getUserZoneVote(entityId, user.username);
        setUserVote(v);
      } catch { /* silent */ }
    }
  }, [entityId, entityType, user?.username]);

  const loadComments = useCallback(async () => {
    setCommentsLoading(true);
    try {
      let raw: Comment[] = [];
      if (entityType === 'location') raw = (await getComments(entityId)) as Comment[];
      else if (entityType === 'route') raw = (await getRouteComments(entityId)) as Comment[];
      else raw = (await getZoneComments(entityId)) as Comment[];
      setComments(raw);
    } catch { /* silent */ } finally {
      setCommentsLoading(false);
    }
  }, [entityId, entityType]);

  const loadMedia = useCallback(async () => {
    try {
      if (entityType === 'location') {
        const [imgs, docs] = await Promise.all([getLocationImages(entityId), getLocationDocuments(entityId)]);
        setLocImages(imgs); setLocDocuments(docs);
      } else if (entityType === 'route') {
        const [imgs, docs] = await Promise.all([getRouteImages(entityId), getRouteDocuments(entityId)]);
        setRouteImages(imgs); setRouteDocuments(docs);
      } else {
        const [imgs, docs] = await Promise.all([getZoneImages(entityId), getZoneDocuments(entityId)]);
        setZoneImages(imgs); setZoneDocuments(docs);
      }
    } catch { /* silent */ }
  }, [entityId, entityType]);

  useEffect(() => {
    loadVotes();
    loadComments();
    loadMedia();
  }, [loadVotes, loadComments, loadMedia]);

  // ── Vote handler ────────────────────────────────────────────────────────────

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!user?.username || isVoting) return;
    setIsVoting(true);
    try {
      if (userVote === voteType) {
        if (entityType === 'location') await removeVote(entityId, user.username);
        else if (entityType === 'route') await removeRouteVote(entityId, user.username);
        else await removeZoneVote(entityId, user.username);
        setUserVote(null);
      } else {
        if (entityType === 'location') await voteLocation(entityId, user.username, voteType);
        else if (entityType === 'route') await voteRoute(entityId, user.username, voteType);
        else await voteZone(entityId, user.username, voteType);
        setUserVote(voteType);
      }
      await loadVotes();
    } catch { /* silent */ } finally {
      setIsVoting(false);
    }
  };

  // ── Comment handlers ────────────────────────────────────────────────────────

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.size > MAX_IMAGE_SIZE || !file.type.startsWith('image/')) return;
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (newRating === 0) {
      setSubmitError('Izaberite ocenu (1–5 zvezda) pre slanja komentara.');
      return;
    }
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      if (entityType === 'location') {
        await addComment({ location_id: entityId, username: user.username, comment: newComment || undefined, rating: newRating, image: selectedImage || undefined });
      } else if (entityType === 'route') {
        await addRouteComment({ route_id: entityId, username: user.username, comment: newComment || undefined, rating: newRating });
      } else {
        await addZoneComment({ zone_id: entityId, username: user.username, comment: newComment || undefined, rating: newRating });
      }
      setNewComment('');
      setNewRating(0);
      clearImage();
      await loadComments();
    } catch {
      setSubmitError('Greška pri slanju komentara. Pokušajte ponovo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (id: string) => {
    try {
      if (entityType === 'location') await deleteComment(id);
      else if (entityType === 'route') await deleteRouteComment(id);
      else await deleteZoneComment(id);
      await loadComments();
    } catch { /* silent */ }
  };

  // ── Inline edit ────────────────────────────────────────────────────────────

  const startEdit = () => {
    setEditName(entity.data.name);
    setEditDesc(entity.data.description || '');
    if (entityType === 'location') {
      setEditDescEn(entity.data.description_en || '');
      setEditDescSr(entity.data.description_sr || '');
      setEditCategory(entity.data.category || 'other');
      setEditLocColor(entity.data.color || getCategoryDef(entity.data.category || 'other').defaultColor);
    }
    if (entityType === 'route') {
      setEditRouteType(entity.data.route_type);
      setEditRouteCategory((entity.data as any).category || 'other');
      setEditColor(entity.data.color);
      setEditDistKm(entity.data.distance_km?.toString() || '');
      setEditTimeMin(entity.data.estimated_time_min?.toString() || '');
    }
    if (entityType === 'zone') {
      setEditZoneType(entity.data.zone_type);
      setEditZoneCategory((entity.data as any).category || 'other');
      setEditColor(entity.data.color);
      setEditFillColor(entity.data.fill_color);
    }
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;
    setIsSaving(true);
    try {
      if (entityType === 'location') {
        await updateLocation(entityId, {
          name: editName.trim(),
          description: editDesc || undefined,
          description_en: editDescEn || undefined,
          description_sr: editDescSr || undefined,
          category: editCategory,
          icon: getCategoryDef(editCategory).emoji,
          color: editLocColor,
        });
        if (newImages.length > 0) {
          const firstPath = await uploadLocationImages(entityId, newImages);
          if (firstPath && !entity.data.preview_image_url) {
            await updateLocation(entityId, { preview_image_url: getStorageUrl(STORAGE_BUCKETS.IMAGES, firstPath) });
          }
        }
        if (newDocuments.length > 0) await uploadLocationDocuments(entityId, newDocuments);
        setNewImages([]);
        setNewDocuments([]);
        await loadMedia();
      } else if (entityType === 'route') {
        await updateRoute(entityId, {
          name: editName.trim(),
          description: editDesc || undefined,
          route_type: editRouteType,
          color: editColor,
          distance_km: editDistKm ? parseFloat(editDistKm) : null,
          estimated_time_min: editTimeMin ? parseInt(editTimeMin) : null,
          category: editRouteCategory,
          icon: getCategoryDef(editRouteCategory).emoji,
        });
        if (newImages.length > 0) await uploadRouteImages(entityId, newImages);
        if (newDocuments.length > 0) await uploadRouteDocuments(entityId, newDocuments);
        setNewImages([]); setNewDocuments([]);
        await loadMedia();
      } else {
        await updateZone(entityId, {
          name: editName.trim(),
          description: editDesc || undefined,
          zone_type: editZoneType,
          color: editColor,
          fill_color: editFillColor,
          category: editZoneCategory,
          icon: getCategoryDef(editZoneCategory).emoji,
        });
        if (newImages.length > 0) await uploadZoneImages(entityId, newImages);
        if (newDocuments.length > 0) await uploadZoneDocuments(entityId, newDocuments);
        setNewImages([]); setNewDocuments([]);
        await loadMedia();
      }
      setIsEditing(false);
      onUpdated?.();
    } catch { /* silent */ } finally {
      setIsSaving(false);
    }
  };

  // ── Entity delete ───────────────────────────────────────────────────────────

  const handleDeleteEntity = async () => {
    if (!window.confirm(t('location.confirmDelete'))) return;
    setIsDeleting(true);
    try {
      if (entityType === 'location') await deleteLocation(entityId);
      else if (entityType === 'route') await deleteRoute(entityId);
      else await deleteZone(entityId);
      onDeleted?.();
      onClose();
    } catch { /* silent */ } finally {
      setIsDeleting(false);
    }
  };

  // ── Derived ─────────────────────────────────────────────────────────────────

  const avgRating = comments.length > 0
    ? comments.reduce((s, c) => s + c.rating, 0) / comments.length
    : 0;

  const canEdit = isAdmin || user?.username === entity.data.created_by;
  const canDelete = isAdmin;

  let description = entity.data.description;
  if (entityType === 'location') {
    const lang = i18n.language;
    description = (lang === 'sr' ? entity.data.description_sr : entity.data.description_en) || entity.data.description;
  }

  const typeInfo = entityTypeLabel(entity);
  const netScore = voteCounts.up - voteCounts.down;

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'info', label: 'Info', icon: 'ℹ️' },
    { id: 'glasanje', label: 'Glasanje', icon: '👍' },
    { id: 'komentari', label: 'Komentari', icon: '⭐' },
    ...(entityType === 'location' ? [{ id: 'diskusija' as TabId, label: 'Diskusija', icon: '💬' }] : []),
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: '85vh' }}
      >
        {/* ── Header ── */}
        <div className={`flex-shrink-0 px-6 pt-5 pb-4 ${
          typeInfo.color === 'green' ? 'bg-gradient-to-br from-green-50 to-white' :
          typeInfo.color === 'blue' ? 'bg-gradient-to-br from-blue-50 to-white' :
          'bg-gradient-to-br from-purple-50 to-white'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                  typeInfo.color === 'green' ? 'bg-green-100 text-green-700' :
                  typeInfo.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {typeInfo.icon} {typeInfo.label}
                </span>
                {avgRating > 0 && (
                  <span className="flex items-center gap-1 text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">
                    ★ {avgRating.toFixed(1)}
                    <span className="text-amber-400 font-normal">({comments.length})</span>
                  </span>
                )}
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  netScore > 0 ? 'bg-green-50 text-green-700' :
                  netScore < 0 ? 'bg-red-50 text-red-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {netScore > 0 ? '+' : ''}{netScore}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">
                {entity.data.name}
              </h2>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <span className="font-medium">{entity.data.created_by || 'Unknown'}</span>
                <span>·</span>
                <span>{new Date(entity.data.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex-shrink-0 flex border-b border-gray-100 px-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-green-700'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600 rounded-full"
                />
              )}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'info' && (
              <motion.div
                key="info"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-6 space-y-4"
              >
                {/* Preview image */}
                {entityType === 'location' && entity.data.preview_image_url && !isEditing && (
                  <div className="w-full h-44 overflow-hidden rounded-xl">
                    <img src={entity.data.preview_image_url} alt={entity.data.name} className="w-full h-full object-cover" />
                  </div>
                )}

                {isEditing ? (
                  /* ── Edit form ── */
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Naziv *</label>
                      <input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </div>

                    {entityType === 'location' ? (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Opis (SR)</label>
                          <textarea value={editDescSr} onChange={e => setEditDescSr(e.target.value)} rows={2}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none resize-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Opis (EN)</label>
                          <textarea value={editDescEn} onChange={e => setEditDescEn(e.target.value)} rows={2}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none resize-none" />
                        </div>

                        {/* Category selector */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">Kategorija</label>
                          <div className="grid grid-cols-4 gap-1 max-h-48 overflow-y-auto pr-0.5">
                            {LOCATION_CATEGORIES.map(cat => (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                  setEditCategory(cat.id);
                                  setEditLocColor(getCategoryDef(cat.id).defaultColor);
                                }}
                                className={`flex flex-col items-center gap-0.5 px-1 py-2 rounded-xl border text-center transition-all ${
                                  editCategory === cat.id
                                    ? 'border-2 shadow-sm scale-[1.03]'
                                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                                }`}
                                style={editCategory === cat.id
                                  ? { borderColor: editLocColor, backgroundColor: editLocColor + '18', color: editLocColor }
                                  : {}}
                                title={cat.label}
                              >
                                <span className="text-base leading-none">{cat.emoji}</span>
                                <span className="leading-tight text-center" style={{ fontSize: '9px' }}>{cat.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Color picker */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">Boja markera</label>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {['#22c55e','#3b82f6','#ef4444','#f59e0b','#8b5cf6','#ec4899','#0ea5e9','#10b981','#f97316','#dc2626','#16a34a','#6b7280'].map(c => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setEditLocColor(c)}
                                className={`w-6 h-6 rounded-full border-2 transition-transform ${editLocColor === c ? 'border-gray-800 scale-125' : 'border-white shadow'}`}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                            <input
                              type="color"
                              value={editLocColor}
                              onChange={e => setEditLocColor(e.target.value)}
                              className="w-6 h-6 rounded-full border border-gray-300 cursor-pointer p-0.5"
                              title="Prilagođena boja"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Opis</label>
                        <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={2}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none resize-none" />
                      </div>
                    )}

                    {entityType === 'route' && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Tip rute</label>
                          <div className="grid grid-cols-5 gap-1">
                            {[
                              { id: 'cycling', label: 'Biciklist.', emoji: '🚲' },
                              { id: 'walking', label: 'Pešačka', emoji: '🚶' },
                              { id: 'hiking', label: 'Planinska', emoji: '🥾' },
                              { id: 'biotop', label: 'Biotop', emoji: '🌿' },
                              { id: 'other', label: 'Ostalo', emoji: '📍' },
                            ].map(rt => (
                              <button key={rt.id} type="button"
                                onClick={() => setEditRouteType(rt.id as typeof editRouteType)}
                                className={`flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-lg border text-center transition-all ${
                                  editRouteType === rt.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                                }`}>
                                <span className="text-sm">{rt.emoji}</span>
                                <span style={{ fontSize: '9px' }}>{rt.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Ikonica / kategorija</label>
                          <div className="grid grid-cols-5 gap-1 max-h-32 overflow-y-auto pr-0.5">
                            {LOCATION_CATEGORIES.map(cat => (
                              <button key={cat.id} type="button"
                                onClick={() => { setEditRouteCategory(cat.id); setEditColor(getCategoryDef(cat.id).defaultColor); }}
                                className={`flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-lg border text-center transition-all ${
                                  editRouteCategory === cat.id ? 'border-2 shadow-sm' : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                                }`}
                                style={editRouteCategory === cat.id ? { borderColor: editColor, backgroundColor: editColor + '18', color: editColor } : {}}
                                title={cat.label}>
                                <span className="text-sm leading-none">{cat.emoji}</span>
                                <span className="leading-tight" style={{ fontSize: '8px' }}>{cat.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Dužina (km)</label>
                            <input type="number" value={editDistKm} onChange={e => setEditDistKm(e.target.value)} min="0" step="0.1"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Vreme (min)</label>
                            <input type="number" value={editTimeMin} onChange={e => setEditTimeMin(e.target.value)} min="0"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Boja linije</label>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {['#22c55e','#3b82f6','#ef4444','#f59e0b','#8b5cf6','#ec4899','#0ea5e9','#10b981','#f97316','#6b7280'].map(c => (
                              <button key={c} type="button" onClick={() => setEditColor(c)}
                                className={`w-6 h-6 rounded-full border-2 transition-transform ${editColor === c ? 'border-gray-800 scale-125' : 'border-white shadow'}`}
                                style={{ backgroundColor: c }} />
                            ))}
                            <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)}
                              className="w-6 h-6 rounded-full border border-gray-300 cursor-pointer p-0.5" />
                          </div>
                        </div>
                      </>
                    )}

                    {entityType === 'zone' && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Ikonica / kategorija</label>
                          <div className="grid grid-cols-5 gap-1 max-h-32 overflow-y-auto pr-0.5">
                            {LOCATION_CATEGORIES.map(cat => (
                              <button key={cat.id} type="button"
                                onClick={() => { setEditZoneCategory(cat.id); setEditColor(getCategoryDef(cat.id).defaultColor); setEditFillColor(getCategoryDef(cat.id).defaultColor + '33'); }}
                                className={`flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-lg border text-center transition-all ${
                                  editZoneCategory === cat.id ? 'border-2 shadow-sm' : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                                }`}
                                style={editZoneCategory === cat.id ? { borderColor: editColor, backgroundColor: editColor + '18', color: editColor } : {}}
                                title={cat.label}>
                                <span className="text-sm leading-none">{cat.emoji}</span>
                                <span className="leading-tight" style={{ fontSize: '8px' }}>{cat.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Boja ivice</label>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {['#6366f1','#3b82f6','#22c55e','#ef4444','#f59e0b','#8b5cf6'].map(c => (
                                <button key={c} type="button" onClick={() => setEditColor(c)}
                                  className={`w-5 h-5 rounded-full border-2 transition-transform ${editColor === c ? 'border-gray-800 scale-125' : 'border-white shadow'}`}
                                  style={{ backgroundColor: c }} />
                              ))}
                              <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)}
                                className="w-5 h-5 rounded-full border border-gray-300 cursor-pointer p-0.5" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Boja ispune</label>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {['#a5b4fc','#93c5fd','#86efac','#fca5a5','#fcd34d','#c4b5fd'].map(c => (
                                <button key={c} type="button" onClick={() => setEditFillColor(c)}
                                  className={`w-5 h-5 rounded-full border-2 transition-transform ${editFillColor === c ? 'border-gray-800 scale-125' : 'border-white shadow'}`}
                                  style={{ backgroundColor: c }} />
                              ))}
                              <input type="color" value={editFillColor} onChange={e => setEditFillColor(e.target.value)}
                                className="w-5 h-5 rounded-full border border-gray-300 cursor-pointer p-0.5" />
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* ── Media upload (all types) ── */}
                    <MediaEditSection
                      images={entityType === 'location' ? locImages : entityType === 'route' ? routeImages : zoneImages}
                      documents={entityType === 'location' ? locDocuments : entityType === 'route' ? routeDocuments : zoneDocuments}
                      newImages={newImages}
                      newDocuments={newDocuments}
                      canEdit={canEdit}
                      imgInputRef={imgInputRef}
                      docInputRef={docInputRef}
                      onAddImages={files => setNewImages(prev => [...prev, ...files])}
                      onRemoveNewImage={i => setNewImages(prev => prev.filter((_, j) => j !== i))}
                      onAddDocuments={files => setNewDocuments(prev => [...prev, ...files])}
                      onRemoveNewDocument={i => setNewDocuments(prev => prev.filter((_, j) => j !== i))}
                      onDeleteImage={async (id, path) => {
                        if (entityType === 'location') await deleteLocationImage(id, path);
                        else if (entityType === 'route') await deleteRouteImage(id, path);
                        else await deleteZoneImage(id, path);
                        await loadMedia();
                      }}
                      onDeleteDocument={async (id, path) => {
                        if (entityType === 'location') await deleteLocationDocument(id, path);
                        else if (entityType === 'route') await deleteRouteDocument(id, path);
                        else await deleteZoneDocument(id, path);
                        await loadMedia();
                      }}
                    />

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex-1 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={isSaving || !editName.trim()}
                        className="flex-1 py-2 text-sm font-medium bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50"
                      >
                        {isSaving ? 'Čuvanje...' : 'Sačuvaj'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── View mode ── */
                  <>
                    {description ? (
                      <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Nema opisa.</p>
                    )}

                    {entityType === 'route' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 rounded-xl px-4 py-3 text-center">
                          <div className="text-lg">{ROUTE_TYPE_ICONS[entity.data.route_type]}</div>
                          <div className="text-xs text-blue-600 font-semibold mt-0.5 capitalize">{entity.data.route_type}</div>
                        </div>
                        {entity.data.distance_km && (
                          <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
                            <div className="text-lg">📏</div>
                            <div className="text-xs text-gray-600 font-semibold mt-0.5">{entity.data.distance_km} km</div>
                          </div>
                        )}
                        {entity.data.estimated_time_min && (
                          <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
                            <div className="text-lg">⏱</div>
                            <div className="text-xs text-gray-600 font-semibold mt-0.5">{entity.data.estimated_time_min} min</div>
                          </div>
                        )}
                      </div>
                    )}

                    {entityType === 'zone' && (
                      <div className="bg-purple-50 rounded-xl px-4 py-3 text-sm text-purple-800 font-medium">
                        {ZONE_TYPE_LABELS[entity.data.zone_type] ?? entity.data.zone_type}
                      </div>
                    )}

                    {/* Image gallery */}
                    <MediaViewSection
                      images={entityType === 'location' ? locImages : entityType === 'route' ? routeImages : zoneImages}
                      documents={entityType === 'location' ? locDocuments : entityType === 'route' ? routeDocuments : zoneDocuments}
                    />

                    {(canEdit || canDelete) && (
                      <div className="flex gap-2 pt-2">
                        {canEdit && (
                          <button
                            onClick={startEdit}
                            className="flex-1 py-2 px-4 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-colors"
                          >
                            ✏️ Uredi
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={handleDeleteEntity}
                            disabled={isDeleting}
                            className="py-2 px-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl hover:bg-red-100 transition-colors border border-red-200 disabled:opacity-50"
                          >
                            🗑 {t('common.delete')}
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {activeTab === 'glasanje' && (
              <motion.div
                key="glasanje"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-6"
              >
                {/* Score summary */}
                <div className="text-center mb-8">
                  <div className={`text-5xl font-bold mb-1 ${
                    netScore > 0 ? 'text-green-600' : netScore < 0 ? 'text-red-500' : 'text-gray-400'
                  }`}>
                    {netScore > 0 ? '+' : ''}{netScore}
                  </div>
                  <div className="text-sm text-gray-500">Ukupni rezultat</div>
                </div>

                {/* Vote buttons */}
                {user ? (
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => handleVote('up')}
                      disabled={isVoting}
                      className={`flex flex-col items-center gap-2 px-8 py-5 rounded-2xl border-2 transition-all ${
                        userVote === 'up'
                          ? 'bg-green-50 border-green-400 text-green-700 shadow-sm shadow-green-100'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-green-300 hover:bg-green-50 hover:text-green-600'
                      }`}
                    >
                      <svg className="w-8 h-8" fill={userVote === 'up' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                      <span className="text-xl font-bold">{voteCounts.up}</span>
                      <span className="text-xs font-medium uppercase tracking-wide">Za</span>
                    </button>

                    <button
                      onClick={() => handleVote('down')}
                      disabled={isVoting}
                      className={`flex flex-col items-center gap-2 px-8 py-5 rounded-2xl border-2 transition-all ${
                        userVote === 'down'
                          ? 'bg-red-50 border-red-400 text-red-600 shadow-sm shadow-red-100'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-red-300 hover:bg-red-50 hover:text-red-500'
                      }`}
                    >
                      <svg className="w-8 h-8 rotate-180" fill={userVote === 'down' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                      <span className="text-xl font-bold">{voteCounts.down}</span>
                      <span className="text-xs font-medium uppercase tracking-wide">Protiv</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-500 mb-1">Prijavite se da biste glasali.</p>
                    <div className="flex justify-center gap-8 mt-4 text-gray-400">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-500">{voteCounts.up}</div>
                        <div className="text-xs mt-0.5">Za</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-400">{voteCounts.down}</div>
                        <div className="text-xs mt-0.5">Protiv</div>
                      </div>
                    </div>
                  </div>
                )}

                {userVote && (
                  <p className="text-center text-xs text-gray-400 mt-6">
                    Glasali ste <strong>{userVote === 'up' ? 'za' : 'protiv'}</strong>. Kliknite ponovo da poništite glas.
                  </p>
                )}
              </motion.div>
            )}

            {activeTab === 'komentari' && (
              <motion.div
                key="komentari"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col"
              >
                {/* Average rating */}
                {avgRating > 0 && (
                  <div className="px-6 pt-4 pb-3 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-bold text-gray-900">{avgRating.toFixed(1)}</span>
                      <div>
                        <StarRating rating={Math.round(avgRating)} size="md" readonly />
                        <div className="text-xs text-gray-400 mt-0.5">{comments.length} {comments.length === 1 ? 'ocena' : 'ocena'}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comment list */}
                <div className="flex-1 px-6 py-4">
                  {commentsLoading ? (
                    <CommentSkeletonList count={3} />
                  ) : comments.length === 0 ? (
                    <div className="text-center py-10">
                      <div className="text-3xl mb-2">💬</div>
                      <p className="text-sm text-gray-400">{t('comments.noComments')}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {comments.map(comment => (
                        <div key={comment.id} className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <span className="text-sm font-semibold text-gray-900">{comment.username}</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <StarRating rating={comment.rating} size="sm" readonly />
                                <span className="text-xs text-gray-400">
                                  {new Date(comment.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            {(isAdmin || user?.username === comment.username) && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                              >
                                {t('common.delete')}
                              </button>
                            )}
                          </div>
                          {comment.comment && (
                            <p className="text-sm text-gray-700">{comment.comment}</p>
                          )}
                          {comment.image_storage_path && (
                            <a
                              href={getCommentImageUrl(comment.image_storage_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block mt-2"
                            >
                              <img
                                src={getCommentImageUrl(comment.image_storage_path)}
                                alt={comment.image_file_name || 'Comment'}
                                className="w-full max-h-40 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity"
                              />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add comment form */}
                {user && (
                  <form
                    onSubmit={handleSubmitComment}
                    className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-gray-50 space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">{t('comments.yourRating')}:</span>
                      <span className="text-red-400 text-xs">*</span>
                      <StarRating rating={newRating} onRate={(r) => { setNewRating(r); setSubmitError(null); }} size="md" />
                    </div>

                    {entityType === 'location' && imagePreview && (
                      <div className="relative inline-block">
                        <img src={imagePreview} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-gray-200" />
                        <button
                          type="button"
                          onClick={clearImage}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder={t('comments.commentPlaceholder')}
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 bg-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      />

                      {entityType === 'location' && (
                        <>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className={`px-2.5 py-2 text-sm rounded-xl border transition-colors ${
                              selectedImage
                                ? 'bg-blue-50 border-blue-300 text-blue-600'
                                : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-100'
                            }`}
                            title={t('comments.addImage')}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </button>
                        </>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSubmitting ? '...' : t('comments.submit')}
                      </button>
                    </div>
                    {submitError && (
                      <p className="text-xs text-red-500 mt-1">{submitError}</p>
                    )}
                  </form>
                )}
              </motion.div>
            )}

            {activeTab === 'diskusija' && entityType === 'location' && (
              <motion.div
                key="diskusija"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4"
              >
                <DeliberationPanel
                  locationId={entityId}
                  locationName={entity.data.name}
                  onClose={onClose}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

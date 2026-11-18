/**
 * Member Portfolio Management Page — OC Media Platform
 * Phase 3: Add, edit, delete portfolio items in Firestore portfolios/{itemId} collection.
 * Enforced by Firestore Security Rules:
 * request.resource.data.memberUid == request.auth.uid && isMemberActive() && isValidUrl(request.resource.data.url)
 */

import React, { useState } from 'react';
import { useAuth } from '../../lib/auth';
import { usePortfolios } from '../../hooks/useFirestore';
import { useI18n } from '../../lib/i18n';
import { Card, Badge, LoadingSpinner, EmptyState, Modal, ConfirmDialog, showToast } from '../../shared/ui';
import { Plus, Trash2, Edit3, ExternalLink, FolderGit2, Link as LinkIcon, Image, FileText } from 'lucide-react';
import type { PortfolioDocument, PortfolioItemType } from '../../lib/firebaseTypes';

export function PortfolioPage() {
  const { user } = useAuth();
  const { portfolios, loading, addPortfolio, updatePortfolio, deletePortfolio } = usePortfolios(user?.uid);
  const { t } = useI18n();

  // Add / Edit Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioDocument | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<PortfolioItemType>('link');
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    itemId: string;
    itemTitle: string;
  }>({ isOpen: false, itemId: '', itemTitle: '' });
  const [deleting, setDeleting] = useState(false);

  const openAddModal = () => {
    setEditingItem(null);
    setTitle('');
    setDescription('');
    setUrl('');
    setType('link');
    setIsPublic(true);
    setModalOpen(true);
  };

  const openEditModal = (item: PortfolioDocument) => {
    setEditingItem(item);
    setTitle(item.title);
    setDescription(item.description || '');
    setUrl(item.url);
    setType(item.type);
    setIsPublic(item.isPublic);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      showToast(t('يرجى إدخال رابط يبدأ بـ http:// أو https://', 'URL must start with http:// or https://'), 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        await updatePortfolio(editingItem.itemId, {
          title: title.trim(),
          description: description.trim(),
          url: url.trim(),
          type,
          isPublic,
        });
        showToast(t('تم تحديث العمل بنجاح!', 'Portfolio item updated!'), 'success');
      } else {
        if (!user) throw new Error('NOT_AUTHENTICATED');
        await addPortfolio({
          memberUid: user.uid,
          title: title.trim(),
          description: description.trim(),
          url: url.trim(),
          type,
          isPublic,
        });
        showToast(t('تمت إضافة العمل بنجاح إلى المعرض!', 'Portfolio item added!'), 'success');
      }
      setModalOpen(false);
    } catch {
      showToast(t('فشل حفظ العمل. يرجى التأكد من صحة الرابط.', 'Failed to save item.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await deletePortfolio(deleteDialog.itemId);
      showToast(t('تم حذف العمل بنجاح', 'Portfolio item deleted'), 'success');
      setDeleteDialog({ isOpen: false, itemId: '', itemTitle: '' });
    } catch {
      showToast(t('فشل حذف العمل', 'Failed to delete item'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const getTypeIcon = (t: PortfolioItemType) => {
    switch (t) {
      case 'image':
        return <Image className="w-4 h-4 text-emerald-400" />;
      case 'drive_pdf':
        return <FileText className="w-4 h-4 text-amber-400" />;
      default:
        return <LinkIcon className="w-4 h-4 text-brand-cyan" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-brand-blue" />
            <span>{t('معرض أعمالي الإعلامية', 'My Media Portfolio')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t('أضف روابط أعمالك وتصاميمك ومقاطع الفيديو الخاصة بك للمراجعة والتوثيق.', 'Add links to your designs, videos, and media works.')}
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2 rounded-xl bg-brand-blue hover:bg-brand-blueHover text-white text-xs font-bold transition flex items-center gap-2 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t('إضافة عمل جديد', 'Add Portfolio Item')}</span>
        </button>
      </div>

      {/* Grid of Portfolio Items */}
      {loading ? (
        <LoadingSpinner text={t('جاري جلب أعمال المعرض...', 'Loading portfolio items...')} />
      ) : portfolios.length === 0 ? (
        <EmptyState
          icon={FolderGit2}
          title={t('لا توجد أعمال في معرضك حتى الآن', 'No portfolio items yet')}
          description={t('انقر فوق زر "إضافة عمل جديد" لإدراج أول رابط لأعمالك.', 'Click "Add Portfolio Item" to showcase your work.')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolios.map((item) => (
            <Card key={item.itemId} className="p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 text-xs">
                    {getTypeIcon(item.type)}
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{item.type}</span>
                  </div>
                  {item.isPublic ? (
                    <Badge color="emerald">{t('عام', 'Public')}</Badge>
                  ) : (
                    <Badge color="slate">{t('خاص', 'Private')}</Badge>
                  )}
                </div>

                <h3 className="text-sm font-bold text-white leading-snug line-clamp-1">{item.title}</h3>
                {item.description && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                )}
              </div>

              <div className="pt-2 border-t border-brand-border flex items-center justify-between">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-brand-cyan hover:underline flex items-center gap-1 truncate max-w-[150px]"
                  title={item.url}
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate" dir="ltr">{item.url}</span>
                </a>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title={t('تعديل العمل', 'Edit item')}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      setDeleteDialog({
                        isOpen: true,
                        itemId: item.itemId,
                        itemTitle: item.title,
                      })
                    }
                    className="p-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/30 text-red-400 transition"
                    title={t('حذف العمل', 'Delete item')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingItem ? t('تعديل عمل في المعرض', 'Edit Portfolio Item') : t('إضافة عمل جديد للمعرض', 'Add Portfolio Item')}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t('عنوان العمل:', 'Item Title:')}</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('مثال: تغطية حفل تخرج دفعة 2025', 'e.g. Graduation 2025 Video')}
                required
                maxLength={200}
                className="w-full px-3.5 py-2.5 rounded-xl bg-brand-navy border border-brand-border text-white text-xs focus:border-brand-cyan focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t('رابط العمل (URL):', 'Item URL:')}</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://drive.google.com/... or https://behance.net/..."
                required
                maxLength={500}
                className="w-full px-3.5 py-2.5 rounded-xl bg-brand-navy border border-brand-border text-white text-xs font-mono focus:border-brand-cyan focus:outline-none"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t('نوع العمل:', 'Media Type:')}</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as PortfolioItemType)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-brand-navy border border-brand-border text-white text-xs focus:border-brand-cyan focus:outline-none"
              >
                <option value="link">{t('رابط خارجي (Behance / YouTube / Drive)', 'External Link')}</option>
                <option value="image">{t('تصميم أو صورة (Image Link)', 'Image Design')}</option>
                <option value="drive_pdf">{t('ملف PDF من Google Drive', 'Drive PDF Document')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t('وصف مختصر (اختياري):', 'Brief Description (Optional):')}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder={t('دورك في العمل والأدوات المستخدمة...', 'Your role, tools used...')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-brand-navy border border-brand-border text-white text-xs focus:border-brand-cyan focus:outline-none resize-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="rounded border-brand-border text-brand-blue focus:ring-brand-blue"
              />
              <label htmlFor="isPublic" className="text-xs text-slate-300 cursor-pointer">
                {t('جعل العمل مرئياً في المعرض العام للجنة', 'Make visible in team public showcase')}
              </label>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-brand-border">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                {t('إلغاء', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-brand-blue hover:bg-brand-blueHover text-white text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <span>{saving ? t('جاري الحفظ...', 'Saving...') : t('حفظ العمل', 'Save Item')}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, itemId: '', itemTitle: '' })}
        onConfirm={handleConfirmDelete}
        title={t('تأكيد حذف العمل', 'Confirm Deletion')}
        message={t(
          `هل أنت متأكد من حذف العمل "${deleteDialog.itemTitle}" من معرضك؟ لا يمكن التراجع عن هذا الإجراء.`,
          `Are you sure you want to delete "${deleteDialog.itemTitle}"? This action cannot be undone.`
        )}
        confirmLabel={t('نعم، حذف العمل', 'Yes, Delete Item')}
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}

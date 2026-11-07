import { AppButton } from '@/components/AppButton';
import { AppTextField } from '@/components/AppTextField';
import { RatingStars } from '@/components/RatingStars';
import { ScreenHeader } from '@/components/ScreenHeader';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import { AppColors, Radius, SCREEN_PADDING } from '@/constants/appTheme';
import { FEEDBACK_STATUS } from '@/constants/domain';
import { useApi } from '@/hooks/useApi';
import { useCustomerId } from '@/hooks/useCustomerId';
import { getApiErrorMessage } from '@/services/api-client';
import { feedbackService } from '@/services/feedback.service';
import { productService } from '@/services/product.service';
import type { Product } from '@/types/product';
import { formatPrice } from '@/utils/format';
import { ChevronDown, ImageOff, ImagePlus, Lock, Save, Search, Send, X } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

const CONTENT_MAX = 2000;
const IMAGE_MAX_MB = 5;
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;

/** Upload ảnh lên Cloudinary (unsigned preset), trả về URL https. */
async function uploadImage(file: File): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) throw new Error('Chưa cấu hình Cloudinary.');
  const body = new FormData();
  body.append('file', file);
  body.append('upload_preset', UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.secure_url) throw new Error(json?.error?.message ?? 'Tải ảnh lên thất bại.');
  return json.secure_url as string;
}
const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * Viết đánh giá (mục 4.3.3) và CHỈNH SỬA đánh giá (route /feedback/:id/edit) khi còn "Chờ duyệt".
 */
export default function FeedbackCreatePage() {
  const navigate = useNavigate();
  const customerId = useCustomerId();
  const [searchParams] = useSearchParams();
  const { id } = useParams<{ id?: string }>();
  const editId = id ? Number(id) : null;
  const isEdit = editId != null;
  const initialProductId = searchParams.get('productId');

  const [selectedId, setSelectedId] = useState<number | null>(initialProductId ? Number(initialProductId) : null);
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ product?: string; rating?: string; content?: string }>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const lockRef = useRef(false);
  const hydrated = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: products, loading } = useApi(() => productService.list(), []);
  const { data: existing, loading: loadingExisting, error: existingError, reload } = useApi(
    async () => (isEdit ? feedbackService.getById(editId!) : null),
    [editId],
  );

  // Nạp dữ liệu đánh giá cũ vào form (chỉ 1 lần)
  useEffect(() => {
    if (isEdit && existing && !hydrated.current) {
      hydrated.current = true;
      setSelectedId(existing.productId);
      setRating(existing.rating);
      setContent(existing.content);
      setImageUrl(existing.imageUrl ?? null);
    }
  }, [isEdit, existing]);

  const goBack = () => navigate(-1);

  const handlePickImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImageError(null);
    if (!file.type.startsWith('image/')) return setImageError('Vui lòng chọn file ảnh.');
    if (file.size > IMAGE_MAX_MB * 1024 * 1024) return setImageError(`Ảnh tối đa ${IMAGE_MAX_MB}MB.`);
    setUploading(true);
    try {
      setImageUrl(await uploadImage(file));
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Tải ảnh lên thất bại.');
    } finally {
      setUploading(false);
    }
  };
  const selected = products?.find((p) => p.productId === selectedId) ?? null;

  const handleSubmit = async () => {
    if (lockRef.current || uploading) return;
    const next = {
      product: selectedId == null ? 'Vui lòng chọn sản phẩm.' : undefined,
      rating: rating < 1 ? 'Vui lòng chọn số sao.' : undefined,
      content: !content.trim() ? 'Vui lòng nhập nội dung đánh giá.' : content.trim().length > CONTENT_MAX ? `Tối đa ${CONTENT_MAX} ký tự.` : undefined,
    };
    setErrors(next);
    if (Object.values(next).some(Boolean) || selectedId == null || customerId == null) return;

    lockRef.current = true;
    setSubmitting(true);
    setFormError(null);
    try {
      const all = await feedbackService.listByCustomer(customerId).catch(() => []);
      const duplicated = all.some((f) => f.feedbackId !== editId && f.productId === selectedId && normalize(f.content) === normalize(content));
      if (duplicated) {
        setErrors((prev) => ({ ...prev, content: 'Bạn đã gửi đúng nội dung này cho sản phẩm này rồi.' }));
        return;
      }

      if (isEdit) {
        await feedbackService.update(editId!, { content: content.trim(), rating, imageUrl: imageUrl ?? '' });
        alert('Đã cập nhật đánh giá. Đánh giá vẫn đang chờ cửa hàng duyệt.');
      } else {
        await feedbackService.create({ customerId, productId: selectedId, content: content.trim(), rating, imageUrl: imageUrl ?? undefined });
        alert('Đã gửi đánh giá. Phản hồi của bạn đang chờ cửa hàng duyệt. Cảm ơn bạn!');
      }
      goBack();
    } catch (e) {
      setFormError(getApiErrorMessage(e, 'Vui lòng thử lại sau.'));
    } finally {
      setSubmitting(false);
      lockRef.current = false;
    }
  };

  // ----- Chế độ sửa: kiểm tra có được phép sửa không -----
  if (isEdit) {
    if (loadingExisting && !existing) return <div><ScreenHeader title="Chỉnh sửa đánh giá" onBack={goBack} /><LoadingView /></div>;
    if (!existing) return <div><ScreenHeader title="Chỉnh sửa đánh giá" onBack={goBack} /><ErrorView message={existingError ?? 'Không tìm thấy đánh giá.'} onRetry={reload} /></div>;
    if (existing.status !== FEEDBACK_STATUS.PENDING) {
      return (
        <div>
          <ScreenHeader title="Chỉnh sửa đánh giá" onBack={goBack} />
          <EmptyView icon={Lock} title="Không thể chỉnh sửa đánh giá này"
            message="Đánh giá đã được cửa hàng xử lý (duyệt hoặc từ chối) nên không thể chỉnh sửa nữa."
            actionLabel="Quay lại" onAction={goBack} />
        </div>
      );
    }
  }

  return (
    <div>
      <ScreenHeader title={isEdit ? 'Chỉnh sửa đánh giá' : 'Viết đánh giá'} onBack={goBack} />
      {loading && !products ? <LoadingView /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: `4px ${SCREEN_PADDING}px 32px` }}>
          {isEdit ? (
            <div style={{ padding: '10px 14px', borderRadius: Radius.md, background: AppColors.accentSoft, color: AppColors.textSecondary, fontSize: 13 }}>
              Bạn chỉ có thể chỉnh sửa khi đánh giá còn <b>chờ duyệt</b>. Sau khi được duyệt hoặc từ chối, nội dung sẽ bị khóa.
            </div>
          ) : null}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ color: AppColors.textPrimary, fontSize: 13, fontWeight: 600 }}>Sản phẩm</span>
            <button onClick={() => { if (!isEdit) setPickerOpen(true); }} disabled={isEdit} style={{
              display: 'flex', alignItems: 'center', gap: 12, minHeight: 64, padding: '0 14px', borderRadius: Radius.md,
              border: `1px solid ${errors.product ? AppColors.danger : AppColors.border}`, background: AppColors.surface, textAlign: 'left',
              cursor: isEdit ? 'default' : 'pointer',
            }}>
              {selected ? (
                <>
                  <ProductThumb product={selected} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: AppColors.textPrimary, fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.productName}</div>
                    <div style={{ color: AppColors.textSecondary, fontSize: 12 }}>{formatPrice(selected.price)}</div>
                  </div>
                </>
              ) : <span style={{ flex: 1, color: AppColors.textSecondary, fontSize: 15 }}>Chọn sản phẩm bạn muốn đánh giá</span>}
              {isEdit ? <Lock size={16} color={AppColors.textSecondary} /> : <ChevronDown size={18} color={AppColors.textSecondary} />}
            </button>
            {errors.product ? <span style={{ color: AppColors.danger, fontSize: 12 }}>{errors.product}</span> : null}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ color: AppColors.textPrimary, fontSize: 13, fontWeight: 600 }}>Mức độ hài lòng</span>
            <RatingStars value={rating} size={34} onChange={setRating} />
            {errors.rating ? <span style={{ color: AppColors.danger, fontSize: 12 }}>{errors.rating}</span> : null}
          </div>

          <AppTextField label="Nội dung" placeholder="Chất liệu, độ vừa chân, chất lượng sau khi sử dụng..." multiline value={content} onChangeText={(v) => { setContent(v); setErrors((p) => ({ ...p, content: undefined })); }} maxLength={CONTENT_MAX} error={errors.content} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ color: AppColors.textPrimary, fontSize: 13, fontWeight: 600 }}>Hình ảnh thực tế (không bắt buộc)</span>
            {imageUrl ? (
              <div style={{ position: 'relative', width: 140, height: 140 }}>
                <img src={imageUrl} alt="Ảnh đánh giá" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: Radius.md, border: `1px solid ${AppColors.border}` }} />
                <button type="button" onClick={() => setImageUrl(null)} aria-label="Xóa ảnh"
                  style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 13, border: 'none', background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={16} color="#fff" />
                </button>
              </div>
            ) : (
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: 140, height: 140, borderRadius: Radius.md, border: `1.5px dashed ${AppColors.border}`, background: AppColors.surface, color: AppColors.textSecondary, fontSize: 13, cursor: uploading ? 'default' : 'pointer', flexDirection: 'column' }}>
                <ImagePlus size={26} />
                {uploading ? 'Đang tải ảnh...' : 'Thêm ảnh'}
                <input type="file" accept="image/*" onChange={handlePickImage} disabled={uploading} style={{ display: 'none' }} />
              </label>
            )}
            {imageError ? <span style={{ color: AppColors.danger, fontSize: 12 }}>{imageError}</span> : null}
          </div>

          {formError ? <span style={{ color: AppColors.danger, fontSize: 13 }}>{formError}</span> : null}

          <AppButton label={isEdit ? 'Lưu thay đổi' : 'Gửi đánh giá'} icon={isEdit ? Save : Send} onClick={handleSubmit} loading={submitting || uploading} />
        </div>
      )}

      {pickerOpen ? (
        <ProductPickerModal products={products ?? []} selectedId={selectedId} onClose={() => setPickerOpen(false)}
          onSelect={(p) => { setSelectedId(p.productId); setErrors((prev) => ({ ...prev, product: undefined })); setPickerOpen(false); }} />
      ) : null}
    </div>
  );
}

function ProductThumb({ product }: { product: Product }) {
  return (
    <div style={{ width: 44, height: 44, borderRadius: Radius.sm, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: AppColors.background, flexShrink: 0 }}>
      {product.imageUrl ? <img src={product.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageOff size={18} color={AppColors.textSecondary} />}
    </div>
  );
}

function ProductPickerModal({ products, selectedId, onClose, onSelect }: { products: Product[]; selectedId: number | null; onClose: () => void; onSelect: (p: Product) => void; }) {
  const [query, setQuery] = useState('');
  const filtered = products.filter((p) => p.productName.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div style={{ position: 'fixed', inset: 0, background: AppColors.background, zIndex: 50, display: 'flex', flexDirection: 'column', maxWidth: 640, margin: '0 auto', boxShadow: '0 0 0 100vmax rgba(0,0,0,.4)' }}>
      <ScreenHeader title="Chọn sản phẩm" right={<button onClick={onClose} aria-label="Đóng" style={{ background: 'none', border: 'none' }}><X size={26} color={AppColors.textPrimary} /></button>} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: `0 ${SCREEN_PADDING}px 12px`, padding: '0 14px', borderRadius: Radius.md, border: `1px solid ${AppColors.border}`, background: AppColors.surface }}>
        <Search size={18} color={AppColors.textSecondary} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm tên giày..." style={{ flex: 1, minHeight: 48, background: 'transparent', border: 'none', outline: 'none', color: AppColors.textPrimary, fontSize: 15 }} />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: `0 ${SCREEN_PADDING}px 24px`, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? <EmptyView icon={Search} title="Không tìm thấy sản phẩm" /> : filtered.map((item) => {
          const active = item.productId === selectedId;
          return (
            <button key={item.productId} onClick={() => onSelect(item)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: Radius.md,
              border: `1px solid ${active ? AppColors.accent : AppColors.border}`, background: AppColors.surface, textAlign: 'left',
            }}>
              <ProductThumb product={item} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: AppColors.textPrimary, fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.productName}</div>
                <div style={{ color: AppColors.textSecondary, fontSize: 12 }}>{[item.brand, formatPrice(item.price)].filter(Boolean).join(' • ')}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

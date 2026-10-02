import { AppButton } from '@/components/AppButton';
import { AppTextField } from '@/components/AppTextField';
import { Chip } from '@/components/Chip';
import { RatingStars } from '@/components/RatingStars';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { StatusBadge, type BadgeTone } from '@/components/StatusBadge';
import { AppColors } from '@/constants/appTheme';
import { SITE } from '@/constants/site';
import { GENDER_OPTIONS, PREFERENCE_SUGGESTIONS } from '@/constants/domain';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { useCustomerId } from '@/hooks/useCustomerId';
import { getApiErrorMessage } from '@/services/api-client';
import { customerService } from '@/services/customer.service';
import { feedbackService } from '@/services/feedback.service';
import { productService } from '@/services/product.service';
import { surveyService } from '@/services/survey.service';
import type { CustomerProfile } from '@/types/customer';
import type { Feedback, FeedbackStatus } from '@/types/feedback';
import type { Product } from '@/types/product';
import type { SurveyTarget } from '@/types/survey';
import { formatDate, formatDateOnly, formatPrice, toDateInput } from '@/utils/format';
import { recommendProducts } from '@/utils/recommend';
import { normalizeEmail, normalizePhone, normalizeSpaces, validateAddress, validateDateOfBirth, validateFullName, PASSWORD_RULES, validateEmail, validateNewPassword, validatePhone } from '@/utils/validation';
import { Check, ClipboardList, Edit3, Grid, Heart, History, ImageOff, Key, LogOut, MessageCircle, Phone, ShieldCheck, User, type LucideIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { showConfirm } from '@/lib/dialog';

type Section = 'info' | 'prefs' | 'history' | 'password';
type ProfileForm = { fullName: string; dateOfBirth: string; gender: string; phone: string; email: string; address: string };
type FormErrors = Partial<Record<keyof ProfileForm, string | null>>;
const EMPTY_PASSWORD = { oldPassword: '', newPassword: '', confirm: '' };

const MENU: { key: Section; label: string; icon: LucideIcon }[] = [
  { key: 'info', label: 'Thông tin tài khoản', icon: User },
  { key: 'prefs', label: 'Sở thích mua sắm', icon: Heart },
  { key: 'history', label: 'Lịch sử', icon: History },
  { key: 'password', label: 'Đổi mật khẩu', icon: Key },
];

const STATUS_META: Record<FeedbackStatus, { label: string; tone: BadgeTone }> = {
  Pending: { label: 'Chờ duyệt', tone: 'warning' },
  Approved: { label: 'Đã duyệt', tone: 'success' },
  Rejected: { label: 'Không được duyệt', tone: 'danger' },
};

const PREF_DESC: Record<string, string> = {
  'Giày Sneaker': 'Năng động, dễ phối đồ',
  'Giày Chạy Bộ': 'Nhẹ, êm, thoáng khí',
  'Giày Bóng Rổ': 'Bám sân, hỗ trợ cổ chân',
  'Giày Thể Thao': 'Luyện tập mọi bộ môn',
  'Giày Cao Gót': 'Thanh lịch, sang trọng',
  'Giày Sandal': 'Thoáng mát ngày hè',
  'Giày Da': 'Lịch sự cho công sở',
};

const PASSWORD_TIPS = [
  'Dùng ít nhất 6 ký tự, gồm chữ hoa, chữ số và ký tự đặc biệt.',
  'Không dùng lại mật khẩu của các tài khoản khác.',
  'Không chia sẻ mật khẩu cho bất kỳ ai, kể cả nhân viên cửa hàng.',
];

/** Hồ sơ người dùng: menu bên trái, nội dung bên phải (mỗi mục đều có cột phụ để không bị trống). */
export default function ProfilePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { logout, account } = useAuth();
  const customerId = useCustomerId();

  const { data, loading, error, reload } = useApi(async () => {
    if (customerId == null) throw new Error('Không xác định được tài khoản khách hàng.');
    const [profile, preferences, surveys, feedbacks, products] = await Promise.all([
      customerService.getProfile(customerId),
      customerService.listPreferences(customerId),
      surveyService.listByCustomer(customerId).catch(() => [] as SurveyTarget[]),
      feedbackService.listByCustomer(customerId).catch(() => [] as Feedback[]),
      productService.list().catch(() => [] as Product[]),
    ]);
    return { profile, preferences, surveys, feedbacks, products };
  }, [customerId]);

  const initialTab = params.get('tab') as Section | null;
  const [section, setSection] = useState<Section>(MENU.some((m) => m.key === initialTab) ? (initialTab as Section) : 'info');

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileForm>({ fullName: '', dateOfBirth: '', gender: '', phone: '', email: '', address: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [savingTag, setSavingTag] = useState<string | null>(null);
  const [pw, setPw] = useState(EMPTY_PASSWORD);
  const [pwErrors, setPwErrors] = useState<Partial<Record<keyof typeof EMPTY_PASSWORD, string | null>>>({});
  const [pwSaving, setPwSaving] = useState(false);

  if (loading && !data) return <LoadingView />;
  if (!data) return <ErrorView message={error ?? 'Vui lòng thử lại.'} onRetry={reload} />;

  const { profile, preferences, surveys, feedbacks, products } = data;
  const productNames = new Map(products.map((p) => [p.productId, p.productName]));
  const tags = preferences.map((p) => p.preferenceTag);

  const completedSurveys = surveys.filter((t) => t.isCompleted).length;
  const approvedCount = feedbacks.filter((f) => f.status === 'Approved').length;
  const recentFeedbacks = [...feedbacks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3);
  const recentSurveys = [...surveys].sort((a, b) => new Date(b.survey.createdAt).getTime() - new Date(a.survey.createdAt).getTime()).slice(0, 3);
  const matched = recommendProducts(products, tags).slice(0, 4);

  const avgRating = feedbacks.length ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1) : '—';
  const allMatched = recommendProducts(products, tags);
  const avgMatchedPrice = allMatched.length ? allMatched.reduce((sum, p) => sum + Number(p.price), 0) / allMatched.length : null;
  const brandCount = new Map<string, number>();
  allMatched.forEach((p) => { if (p.brand) brandCount.set(p.brand, (brandCount.get(p.brand) ?? 0) + 1); });
  const topBrand = [...brandCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({ star, n: feedbacks.filter((f) => f.rating === star).length }));

  const pwRules: [string, boolean][] = PASSWORD_RULES.map((r) => [r.label, r.test(pw.newPassword)]);
  const pwScore = pwRules.filter(([, ok]) => ok).length;
  const pwLabel = pw.newPassword ? ['Yếu', 'Yếu', 'Trung bình', 'Khá', 'Mạnh'][pwScore] : '—';

  const startEditing = (p: CustomerProfile) => {
    setForm({ fullName: p.fullName, dateOfBirth: toDateInput(p.dateOfBirth), gender: p.gender ?? '', phone: p.phone ?? '', email: p.email ?? '', address: p.address ?? '' });
    setErrors({});
    setEditing(true);
  };
  const setField = (field: keyof ProfileForm) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const saveProfile = async () => {
    if (customerId == null || saving) return;
    const next: FormErrors = { fullName: validateFullName(form.fullName), dateOfBirth: validateDateOfBirth(form.dateOfBirth), phone: validatePhone(form.phone), email: validateEmail(form.email), address: validateAddress(form.address) };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    setSaving(true);
    try {
      await customerService.updateProfile(customerId, { fullName: normalizeSpaces(form.fullName), dateOfBirth: form.dateOfBirth.trim(), gender: form.gender || undefined, phone: normalizePhone(form.phone), email: normalizeEmail(form.email), address: normalizeSpaces(form.address) });
      setEditing(false);
      await reload();
      alert('Đã lưu. Thông tin cá nhân của bạn đã được cập nhật.');
    } catch (e) {
      alert('Không lưu được: ' + getApiErrorMessage(e, 'Vui lòng thử lại sau.'));
    } finally { setSaving(false); }
  };

  const toggleTag = async (tag: string) => {
    if (customerId == null) return;
    const existing = preferences.find((p) => p.preferenceTag === tag);
    setSavingTag(tag);
    try {
      if (existing) await customerService.removePreference(existing.preferenceId);
      else await customerService.addPreference(customerId, tag);
      await reload();
    } catch (e) {
      alert('Không cập nhật được sở thích: ' + getApiErrorMessage(e, 'Vui lòng thử lại sau.'));
    } finally { setSavingTag(null); }
  };

  const changePassword = async () => {
    if (customerId == null) return;
    const next = {
      oldPassword: pw.oldPassword ? null : 'Vui lòng nhập mật khẩu hiện tại.',
      newPassword: validateNewPassword(pw.newPassword, profile.username)
        ?? (pw.newPassword === pw.oldPassword ? 'Mật khẩu mới phải khác mật khẩu hiện tại.' : null),
      confirm: pw.confirm !== pw.newPassword ? 'Mật khẩu nhập lại không khớp.' : null,
    };
    setPwErrors(next);
    if (Object.values(next).some(Boolean)) return;
    setPwSaving(true);
    try {
      await customerService.changePassword(customerId, { oldPassword: pw.oldPassword, newPassword: pw.newPassword });
      setPw(EMPTY_PASSWORD);
      alert('Đã đổi mật khẩu. Lần đăng nhập sau hãy dùng mật khẩu mới.');
    } catch (e) {
      alert('Không đổi được mật khẩu: ' + getApiErrorMessage(e, 'Vui lòng thử lại sau.'));
    } finally { setPwSaving(false); }
  };

  const handleLogout = async () => {
    const ok = await showConfirm({ title: 'Đăng xuất?', message: 'Bạn có chắc muốn đăng xuất khỏi tài khoản này?', confirmLabel: 'Đăng xuất', tone: 'warning', danger: true });
    if (!ok) return;
    logout();
    navigate('/tabs', { replace: true });
  };

  return (
    <div className="account-layout">
      <aside className="account-side">
        <div className="account-user">
          <div className="account-avatar"><User size={40} /></div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: AppColors.textPrimary }}>{profile.fullName}</div>
            <div style={{ fontSize: 13, color: AppColors.textSecondary }}>@{profile.username}</div>
          </div>
        </div>
        <nav className="account-menu">
          {MENU.map(({ key, label, icon: Icon }) => (
            <button key={key} className={section === key ? 'active' : ''} onClick={() => setSection(key)}><Icon size={18} />{label}</button>
          ))}
          <button className="danger" onClick={handleLogout}><LogOut size={18} />Đăng xuất</button>
        </nav>
      </aside>

      <div className="account-content">
        {/* ===== Thông tin tài khoản ===== */}
        {section === 'info' ? (
          <div className="panel">
            <div className="panel-head">
              <div>
                <div className="panel-title">Thông tin tài khoản</div>
                <div className="panel-sub">Thông tin cá nhân bạn đã đăng ký với cửa hàng.</div>
              </div>
              {!editing ? <AppButton label="Chỉnh sửa" icon={Edit3} variant="secondary" compact onClick={() => startEditing(profile)} /> : null}
            </div>
            {editing ? (
              <>
                <div className="form-grid">
                  <AppTextField label="Họ và tên" maxLength={100} value={form.fullName} onChangeText={setField('fullName')} error={errors.fullName} />
                  <AppTextField label="Ngày sinh" type="date" min="1900-01-01" max={new Date().toISOString().slice(0, 10)} value={form.dateOfBirth} onChangeText={setField('dateOfBirth')} error={errors.dateOfBirth} />
                  <div className="full" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ color: AppColors.textPrimary, fontSize: 13, fontWeight: 600 }}>Giới tính</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {GENDER_OPTIONS.map((g) => <Chip key={g} label={g} selected={form.gender === g} onClick={() => setField('gender')(form.gender === g ? '' : g)} />)}
                    </div>
                  </div>
                  <AppTextField label="Số điện thoại" inputMode="tel" maxLength={15} placeholder="vd: 0912345678" value={form.phone} onChangeText={setField('phone')} error={errors.phone} />
                  <AppTextField label="Email" type="email" inputMode="email" maxLength={100} placeholder="ten@gmail.com" value={form.email} onChangeText={setField('email')} error={errors.email} />
                  <div className="full">
                    <AppTextField label="Địa chỉ" maxLength={255} value={form.address} onChangeText={setField('address')} error={errors.address} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 20, maxWidth: 360 }}>
                  <AppButton label="Hủy" variant="secondary" style={{ flex: 1 }} onClick={() => setEditing(false)} />
                  <AppButton label="Lưu thay đổi" style={{ flex: 1 }} onClick={saveProfile} loading={saving} />
                </div>
              </>
            ) : (
              <>
                <div className="info-grid">
                  <InfoRow label="Họ và tên" value={profile.fullName} />
                  <InfoRow label="Ngày sinh" value={formatDateOnly(profile.dateOfBirth)} />
                  <InfoRow label="Giới tính" value={profile.gender} />
                  <InfoRow label="Số điện thoại" value={profile.phone} />
                  <InfoRow label="Email" value={profile.email} />
                  <InfoRow label="Địa chỉ" value={profile.address} />
                  <InfoRow label="Tên đăng nhập" value={`@${profile.username}`} />
                  <InfoRow label="Ngày tạo tài khoản" value={account?.createdAt ? formatDate(account.createdAt) : null} />
                  <InfoRow label="Trạng thái" value={profile.isLocked ? 'Đã khóa' : 'Đang hoạt động'} />
                </div>
                <div className="mini-stats">
                  <div className="mini-stat"><small>Khảo sát đã nộp</small><b>{completedSurveys}/{surveys.length}</b></div>
                  <div className="mini-stat"><small>Đánh giá đã gửi</small><b>{feedbacks.length}</b></div>
                  <div className="mini-stat"><small>Điểm chấm trung bình</small><b>{avgRating}</b></div>
                </div>
              </>
            )}
          </div>
        ) : null}

        {/* ===== Sở thích ===== */}
        {section === 'prefs' ? (
          <div className="two-col">
            <div className="panel">
              <div className="panel-head">
                <div>
                  <div className="panel-title">Sở thích mua sắm</div>
                  <div className="panel-sub">Chọn loại giày bạn thích để nhận gợi ý sản phẩm phù hợp ở Trang chủ.</div>
                </div>
              </div>
              <div className="pref-grid">
                {PREFERENCE_SUGGESTIONS.map((tag) => {
                  const selected = preferences.some((p) => p.preferenceTag === tag);
                  const isSaving = savingTag === tag;
                  return (
                    <button key={tag} className={`pref-tile${selected ? ' on' : ''}`} onClick={() => { if (!isSaving) toggleTag(tag); }}>
                      <Heart size={20} fill={selected ? '#fff' : 'none'} />
                      <span style={{ flex: 1 }}>{isSaving ? '...' : tag}<small>{PREF_DESC[tag] ?? ''}</small></span>
                      {selected ? <Check size={16} /> : null}
                    </button>
                  );
                })}
              </div>
              {preferences.length === 0 ? <div style={{ color: AppColors.textSecondary, fontSize: 13, marginTop: 14 }}>Bạn chưa chọn sở thích nào.</div> : null}
              <div className="mini-stats">
                <div className="mini-stat"><small>Sản phẩm phù hợp</small><b>{allMatched.length}</b></div>
                <div className="mini-stat"><small>Giá trung bình</small><b>{avgMatchedPrice != null ? formatPrice(avgMatchedPrice) : '—'}</b></div>
                <div className="mini-stat"><small>Thương hiệu nổi bật</small><b>{topBrand}</b></div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-title" style={{ marginBottom: 4 }}>Sản phẩm phù hợp với bạn</div>
              <div className="panel-sub" style={{ marginBottom: 14 }}>Cập nhật ngay theo sở thích đã chọn.</div>
              {matched.length === 0 ? (
                <div style={{ color: AppColors.textSecondary, fontSize: 13 }}>{preferences.length === 0 ? 'Hãy chọn ít nhất một sở thích để xem gợi ý.' : 'Chưa có sản phẩm nào khớp với sở thích của bạn.'}</div>
              ) : matched.map((p) => (
                <div key={p.productId} className="mini-prod" onClick={() => navigate(`/product/${p.productId}`)}>
                  <div style={{ width: 52, height: 52, borderRadius: 12, overflow: 'hidden', background: AppColors.background, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {p.imageUrl ? <img src={p.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageOff size={18} color={AppColors.textSecondary} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.productName}</div>
                    <div style={{ fontSize: 13, color: AppColors.textSecondary }}>{formatPrice(p.price)}</div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 'auto', paddingTop: 16 }}>
                <AppButton label="Xem tất cả sản phẩm" icon={Grid} variant="secondary" compact style={{ width: '100%' }} onClick={() => navigate('/tabs/products')} />
              </div>
            </div>
          </div>
        ) : null}

        {/* ===== Lịch sử ===== */}
        {section === 'history' ? (
          <div className="two-col">
            <div className="col-stack">
              <div className="panel">
                <div className="panel-head">
                  <div className="panel-title">Phản hồi gần đây</div>
                  <button onClick={() => navigate('/tabs/feedbacks')} style={{ background: 'none', border: 'none', color: AppColors.textPrimary, fontSize: 13, fontWeight: 700, textDecoration: 'underline' }}>Xem tất cả</button>
                </div>
                {recentFeedbacks.length === 0 ? (
                  <div style={{ color: AppColors.textSecondary, fontSize: 13 }}>Bạn chưa gửi đánh giá nào.</div>
                ) : recentFeedbacks.map((f) => {
                  const meta = STATUS_META[f.status] ?? STATUS_META.Pending;
                  return (
                    <div key={f.feedbackId} className="list-row">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <span style={{ fontSize: 14.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{productNames.get(f.productId) ?? `Sản phẩm #${f.productId}`}</span>
                        <StatusBadge label={meta.label} tone={meta.tone} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <RatingStars value={f.rating} size={14} />
                        <span style={{ fontSize: 12, color: AppColors.textSecondary }}>{formatDate(f.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="panel">
                <div className="panel-head">
                  <div className="panel-title">Khảo sát gần đây</div>
                  <button onClick={() => navigate('/tabs/surveys')} style={{ background: 'none', border: 'none', color: AppColors.textPrimary, fontSize: 13, fontWeight: 700, textDecoration: 'underline' }}>Xem tất cả</button>
                </div>
                {recentSurveys.length === 0 ? (
                  <div style={{ color: AppColors.textSecondary, fontSize: 13 }}>Chưa có khảo sát nào được gửi cho bạn.</div>
                ) : recentSurveys.map((t) => (
                  <div key={t.surveyId} className="list-row">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <span style={{ fontSize: 14.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.survey.title}</span>
                      <StatusBadge label={t.isCompleted ? 'Đã hoàn thành' : 'Cần làm'} tone={t.isCompleted ? 'success' : 'warning'} />
                    </div>
                    <span style={{ fontSize: 12, color: AppColors.textSecondary }}>{formatDate(t.survey.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-stack">
              <div className="panel">
                <div className="panel-head"><div className="panel-title">Thống kê của bạn</div></div>
                <StatRow label="Đánh giá đã gửi" value={feedbacks.length} />
                <StatRow label="Đánh giá đã được duyệt" value={approvedCount} />
                <StatRow label="Khảo sát đã hoàn thành" value={completedSurveys} />
                <StatRow label="Điểm bạn chấm trung bình" value={avgRating} />
                <div style={{ marginTop: 'auto', paddingTop: 14 }}>
                  <div className="side-title" style={{ padding: '0 0 6px' }}>Phân bố số sao bạn đã chấm</div>
                  {ratingDist.map(({ star, n }) => (
                    <div key={star} className="dist-row">
                      <span style={{ width: 28 }}>{star}★</span>
                      <div className="ov-bar"><span style={{ width: `${feedbacks.length ? (n / feedbacks.length) * 100 : 0}%` }} /></div>
                      <b style={{ width: 20, textAlign: 'right' }}>{n}</b>
                    </div>
                  ))}
                </div>
                <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <AppButton label="Viết đánh giá" icon={MessageCircle} variant="secondary" compact style={{ width: '100%' }} onClick={() => navigate('/feedback/create')} />
                  <AppButton label="Làm khảo sát" icon={ClipboardList} variant="secondary" compact style={{ width: '100%' }} onClick={() => navigate('/tabs/surveys')} />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* ===== Đổi mật khẩu ===== */}
        {section === 'password' ? (
          <div className="two-col">
            <div className="panel">
              <div className="panel-head">
                <div>
                  <div className="panel-title">Đổi mật khẩu</div>
                  <div className="panel-sub">Cập nhật mật khẩu định kỳ để bảo vệ tài khoản của bạn.</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
                <AppTextField label="Mật khẩu hiện tại" type="password" value={pw.oldPassword} onChangeText={(v) => setPw((prev) => ({ ...prev, oldPassword: v }))} error={pwErrors.oldPassword} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <AppTextField label="Mật khẩu mới" placeholder="Tối thiểu 6 ký tự, có chữ hoa, số, ký tự đặc biệt" type="password" maxLength={50} value={pw.newPassword} onChangeText={(v) => setPw((prev) => ({ ...prev, newPassword: v }))} error={pwErrors.newPassword} />
                  <div className="pw-meter">{[1, 2, 3, 4].map((n) => <span key={n} className={pwScore >= n && pw.newPassword ? 'on' : ''} />)}</div>
                  <span style={{ fontSize: 12, color: AppColors.textSecondary }}>Độ mạnh mật khẩu: <b style={{ color: AppColors.textPrimary }}>{pwLabel}</b></span>
                </div>
                <AppTextField label="Nhập lại mật khẩu mới" type="password" maxLength={50} value={pw.confirm} onChangeText={(v) => setPw((prev) => ({ ...prev, confirm: v }))} error={pwErrors.confirm} />
                <div style={{ marginTop: 'auto' }}>
                  <AppButton label="Cập nhật mật khẩu" onClick={changePassword} loading={pwSaving} style={{ width: '100%' }} />
                </div>
              </div>
            </div>

            <div className="col-stack">
              <div className="panel">
                <div className="panel-title" style={{ marginBottom: 8 }}>Yêu cầu mật khẩu</div>
                {pwRules.map(([label, ok]) => (
                  <div key={label} className="check-row">
                    <span className={`check-dot${ok ? ' on' : ''}`}>{ok ? <Check size={14} /> : null}</span>
                    <span style={{ color: ok ? AppColors.textPrimary : AppColors.textSecondary }}>{label}</span>
                  </div>
                ))}
              </div>
              <div className="panel">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <ShieldCheck size={22} />
                  <div className="panel-title" style={{ fontSize: 16 }}>Lưu ý bảo mật</div>
                </div>
                <ul className="tip-list">{PASSWORD_TIPS.map((tip) => <li key={tip}><span>•</span><span>{tip}</span></li>)}</ul>
                <div className="voucher" style={{ marginTop: 'auto' }}>
                  <span className="voucher-icon"><Phone size={18} /></span>
                  <span><b>Cần hỗ trợ? Gọi {SITE.hotline}</b><small>{SITE.hours}</small></span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="stat-row">
      <span style={{ color: AppColors.textSecondary, fontSize: 14 }}>{label}</span>
      <span style={{ fontSize: 18, fontWeight: 800 }}>{value}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '16px 0', borderBottom: `1px solid ${AppColors.border}` }}>
      <span style={{ color: AppColors.textSecondary, fontSize: 14 }}>{label}</span>
      <span style={{ color: AppColors.textPrimary, fontSize: 14, fontWeight: 600, textAlign: 'right' }}>{value || '—'}</span>
    </div>
  );
}

import { AppButton } from '@/components/AppButton';
import { AppTextField } from '@/components/AppTextField';
import { Chip } from '@/components/Chip';
import { RatingStars } from '@/components/RatingStars';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { StatusBadge, type BadgeTone } from '@/components/StatusBadge';
import { AppColors } from '@/constants/appTheme';
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
import { formatDate, formatDateOnly, toDateInput } from '@/utils/format';
import { validateDateOfBirth, validateFullName, validatePassword, validatePhone } from '@/utils/validation';
import { ClipboardList, Edit3, Heart, History, Key, LayoutGrid, LogOut, MessageCircle, User, type LucideIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

type Section = 'overview' | 'info' | 'prefs' | 'history' | 'password';
type ProfileForm = { fullName: string; dateOfBirth: string; gender: string; phone: string; address: string };
type FormErrors = Partial<Record<keyof ProfileForm, string | null>>;
const EMPTY_PASSWORD = { oldPassword: '', newPassword: '', confirm: '' };

const MENU: { key: Section; label: string; icon: LucideIcon }[] = [
  { key: 'overview', label: 'Tổng quan tài khoản', icon: LayoutGrid },
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

/** Hồ sơ người dùng: menu bên trái, nội dung bên phải. */
export default function ProfilePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { logout } = useAuth();
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
  const [section, setSection] = useState<Section>(MENU.some((m) => m.key === initialTab) ? (initialTab as Section) : 'overview');

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileForm>({ fullName: '', dateOfBirth: '', gender: '', phone: '', address: '' });
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

  // Số liệu cho tổng quan / lịch sử
  const filled = [profile.fullName, profile.dateOfBirth, profile.gender, profile.phone, profile.address].filter((v) => !!v && String(v).trim()).length;
  const profilePercent = Math.round((filled / 5) * 100);
  const completedSurveys = surveys.filter((t) => t.isCompleted).length;
  const surveyPercent = surveys.length ? Math.round((completedSurveys / surveys.length) * 100) : 0;
  const approvedCount = feedbacks.filter((f) => f.status === 'Approved').length;
  const feedbackPercent = feedbacks.length ? Math.round((approvedCount / feedbacks.length) * 100) : 0;
  const prefPercent = Math.round((preferences.length / PREFERENCE_SUGGESTIONS.length) * 100);
  const recentFeedbacks = [...feedbacks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const startEditing = (p: CustomerProfile) => {
    setForm({ fullName: p.fullName, dateOfBirth: toDateInput(p.dateOfBirth), gender: p.gender ?? '', phone: p.phone ?? '', address: p.address ?? '' });
    setErrors({});
    setEditing(true);
  };
  const setField = (field: keyof ProfileForm) => (value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const saveProfile = async () => {
    if (customerId == null) return;
    const next: FormErrors = { fullName: validateFullName(form.fullName), dateOfBirth: validateDateOfBirth(form.dateOfBirth), phone: validatePhone(form.phone) };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    setSaving(true);
    try {
      await customerService.updateProfile(customerId, { fullName: form.fullName.trim(), dateOfBirth: form.dateOfBirth.trim(), gender: form.gender || undefined, phone: form.phone.trim(), address: form.address.trim() });
      setEditing(false);
      await reload();
      alert('Đã lưu. Thông tin cá nhân của bạn đã được cập nhật.');
    } catch (e) {
      alert('Không lưu được: ' + getApiErrorMessage(e, 'Vui lòng thử lại sau.'));
    } finally { setSaving(false); }
  };

  /** Chọn/bỏ 1 sở thích trong danh sách có sẵn. */
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
      newPassword: validatePassword(pw.newPassword),
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

  const handleLogout = () => { if (confirm('Bạn có chắc muốn đăng xuất?')) logout(); };

  return (
    <div className="account-layout">
      {/* ===== Menu bên trái ===== */}
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
            <button key={key} className={section === key ? 'active' : ''} onClick={() => setSection(key)}>
              <Icon size={18} />{label}
            </button>
          ))}
          <button className="danger" onClick={handleLogout}><LogOut size={18} />Đăng xuất</button>
        </nav>
      </aside>

      {/* ===== Nội dung bên phải ===== */}
      <div className="account-content">
        {section === 'overview' ? (
          <div className="ov-grid">
            <OverviewCard icon={User} percent={profilePercent}
              text={profilePercent === 100 ? 'Hồ sơ của bạn đã đầy đủ thông tin.' : 'Bạn chưa cập nhật đủ thông tin cá nhân.'}
              actionLabel="Cập nhật ngay" onAction={() => { setSection('info'); startEditing(profile); }} />
            <OverviewCard icon={ClipboardList} percent={surveyPercent}
              text={`Bạn đã hoàn thành ${completedSurveys}/${surveys.length} khảo sát.`}
              actionLabel="Làm khảo sát" onAction={() => navigate('/tabs/surveys')} />
            <OverviewCard icon={MessageCircle} percent={feedbackPercent}
              text={`Bạn đã gửi ${feedbacks.length} đánh giá, ${approvedCount} đã được duyệt.`}
              actionLabel="Viết đánh giá" onAction={() => navigate('/feedback/create')} />
            <OverviewCard icon={Heart} percent={prefPercent}
              text={`Bạn đã chọn ${preferences.length}/${PREFERENCE_SUGGESTIONS.length} sở thích mua sắm.`}
              actionLabel="Chọn sở thích" onAction={() => setSection('prefs')} />
          </div>
        ) : null}

        {section === 'info' ? (
          <div className="panel">
            <div className="panel-head">
              <div className="panel-title">Thông tin tài khoản</div>
              {!editing ? <AppButton label="Chỉnh sửa" icon={Edit3} variant="secondary" compact onClick={() => startEditing(profile)} /> : null}
            </div>
            {editing ? (
              <>
                <div className="form-grid">
                  <AppTextField label="Họ và tên" value={form.fullName} onChangeText={setField('fullName')} error={errors.fullName} />
                  <AppTextField label="Ngày sinh" placeholder="YYYY-MM-DD (vd: 2003-05-20)" value={form.dateOfBirth} onChangeText={setField('dateOfBirth')} error={errors.dateOfBirth} />
                  <div className="full" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ color: AppColors.textPrimary, fontSize: 13, fontWeight: 600 }}>Giới tính</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {GENDER_OPTIONS.map((g) => <Chip key={g} label={g} selected={form.gender === g} onClick={() => setField('gender')(form.gender === g ? '' : g)} />)}
                    </div>
                  </div>
                  <AppTextField label="Số điện thoại" value={form.phone} onChangeText={setField('phone')} error={errors.phone} />
                  <AppTextField label="Địa chỉ" value={form.address} onChangeText={setField('address')} />
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 20, maxWidth: 360 }}>
                  <AppButton label="Hủy" variant="secondary" style={{ flex: 1 }} onClick={() => setEditing(false)} />
                  <AppButton label="Lưu thay đổi" style={{ flex: 1 }} onClick={saveProfile} loading={saving} />
                </div>
              </>
            ) : (
              <div className="info-grid">
                <InfoRow label="Họ và tên" value={profile.fullName} />
                <InfoRow label="Ngày sinh" value={formatDateOnly(profile.dateOfBirth)} />
                <InfoRow label="Giới tính" value={profile.gender} />
                <InfoRow label="Số điện thoại" value={profile.phone} />
                <InfoRow label="Địa chỉ" value={profile.address} />
              </div>
            )}
          </div>
        ) : null}

        {section === 'prefs' ? (
          <div className="panel">
            <div className="panel-head">
              <div>
                <div className="panel-title">Sở thích mua sắm</div>
                <div className="panel-sub">Chọn loại giày bạn thích để nhận gợi ý sản phẩm phù hợp ở Trang chủ.</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {PREFERENCE_SUGGESTIONS.map((tag) => {
                const selected = preferences.some((p) => p.preferenceTag === tag);
                const isSaving = savingTag === tag;
                return <Chip key={tag} label={isSaving ? '...' : tag} selected={selected} onClick={() => { if (!isSaving) toggleTag(tag); }} />;
              })}
            </div>
            {preferences.length === 0 ? <div style={{ color: AppColors.textSecondary, fontSize: 13, marginTop: 14 }}>Bạn chưa chọn sở thích nào.</div> : null}
          </div>
        ) : null}

        {section === 'history' ? (
          <div className="two-col">
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
              <div className="panel-head"><div className="panel-title">Thống kê của bạn</div></div>
              <StatRow label="Đánh giá đã gửi" value={feedbacks.length} />
              <StatRow label="Đánh giá đã được duyệt" value={approvedCount} />
              <StatRow label="Khảo sát đã hoàn thành" value={completedSurveys} />
              <StatRow label="Sở thích đã chọn" value={preferences.length} />
            </div>
          </div>
        ) : null}

        {section === 'password' ? (
          <div className="panel" style={{ maxWidth: 520 }}>
            <div className="panel-head"><div className="panel-title">Đổi mật khẩu</div></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <AppTextField label="Mật khẩu hiện tại" type="password" value={pw.oldPassword} onChangeText={(v) => setPw((prev) => ({ ...prev, oldPassword: v }))} error={pwErrors.oldPassword} />
              <AppTextField label="Mật khẩu mới" placeholder="Tối thiểu 6 ký tự" type="password" value={pw.newPassword} onChangeText={(v) => setPw((prev) => ({ ...prev, newPassword: v }))} error={pwErrors.newPassword} />
              <AppTextField label="Nhập lại mật khẩu mới" type="password" value={pw.confirm} onChangeText={(v) => setPw((prev) => ({ ...prev, confirm: v }))} error={pwErrors.confirm} />
              <AppButton label="Cập nhật mật khẩu" onClick={changePassword} loading={pwSaving} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function OverviewCard({ icon: Icon, text, actionLabel, onAction, percent }: { icon: LucideIcon; text: string; actionLabel: string; onAction: () => void; percent: number }) {
  return (
    <div className="ov-card">
      <div className="ov-body">
        <div className="ov-icon"><Icon size={20} /></div>
        <p>{text}</p>
        <AppButton label={actionLabel} compact onClick={onAction} />
      </div>
      <div className="ov-foot">
        <div className="ov-bar"><span style={{ width: `${percent}%` }} /></div>
        <b>{percent}%</b>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-row">
      <span style={{ color: AppColors.textSecondary, fontSize: 14 }}>{label}</span>
      <span style={{ fontSize: 18, fontWeight: 800 }}>{value}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '10px 0', borderBottom: `1px solid ${AppColors.border}` }}>
      <span style={{ color: AppColors.textSecondary, fontSize: 14 }}>{label}</span>
      <span style={{ color: AppColors.textPrimary, fontSize: 14, fontWeight: 600, textAlign: 'right' }}>{value || '—'}</span>
    </div>
  );
}
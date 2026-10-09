import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Plus } from 'lucide-react';
import './CreatableSelect.css';

interface Props {
  label: string;
  required?: boolean;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  createLabel?: string;
}

/** Dropbar chọn từ dữ liệu có sẵn; muốn giá trị mới phải bấm "Tạo mới" ở cuối danh sách. */
export default function CreatableSelect({ label, required, value, options, onChange, placeholder = '-- Chọn --', createLabel = 'Tạo mới' }: Props) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const close = () => { setOpen(false); setCreating(false); setDraft(''); };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close(); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const list = value && !options.includes(value) ? [...options, value] : options;

  const pick = (v: string) => { onChange(v); close(); };
  const confirmNew = () => {
    const v = draft.trim();
    if (!v) return;
    pick(list.find((o) => o.toLowerCase() === v.toLowerCase()) ?? v);
  };

  return (
    <div className="form-group" ref={ref}>
      <label className="form-label">{label}{required && <span className="required">*</span>}</label>
      <div className="cs">
        <button type="button" className={`cs-trigger${open ? ' open' : ''}`} onClick={() => (open ? close() : setOpen(true))}>
          {value ? <span>{value}</span> : <span className="ph">{placeholder}</span>}
          <ChevronDown size={16} />
        </button>
        {open && (
          <div className="cs-panel">
            <div className="cs-list">
              {list.length === 0 && <div className="cs-empty">Chưa có dữ liệu — hãy tạo mới</div>}
              {list.map((o) => (
                <button type="button" key={o} className={`cs-item${o === value ? ' sel' : ''}`} onClick={() => pick(o)}>
                  {o} {o === value && <Check size={14} />}
                </button>
              ))}
            </div>
            {creating ? (
              <div className="cs-new">
                <input
                  autoFocus
                  value={draft}
                  placeholder={`Nhập ${label.toLowerCase()} mới`}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmNew(); } }}
                />
                <button type="button" className="ok" onClick={confirmNew}>Thêm</button>
                <button type="button" className="no" onClick={() => { setCreating(false); setDraft(''); }}>Hủy</button>
              </div>
            ) : (
              <button type="button" className="cs-create" onClick={() => setCreating(true)}>
                <Plus size={15} /> {createLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiClient } from '@/services/api-client';

// Ảnh mặc định, chỉ dùng khi không gọi được API banner.
export const BANNERS = [
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1600&q=70',
  'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1600&q=70',
  'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1600&q=70',
  'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1600&q=70',
];

/** Banner do admin quản lý, tự trượt qua từng ảnh, dừng khi rê chuột vào. */
export function BannerCarousel({ images, interval = 4500 }: { images?: string[]; interval?: number }) {
  const [remote, setRemote] = useState<string[] | null>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (images) return;
    let alive = true;
    apiClient.get<{ imageUrl: string }[]>('/banners')
      .then(({ data }) => { if (alive) setRemote(data.map((b) => b.imageUrl).filter(Boolean)); })
      .catch(() => { if (alive) setRemote(BANNERS); });
    return () => { alive = false; };
  }, [images]);

  const list = images ?? remote;
  const count = list?.length ?? 0;

  useEffect(() => {
    if (paused || count < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), interval);
    return () => clearInterval(timer);
  }, [paused, count, interval]);

  if (list === null) return <div className="banner" />;
  if (count === 0) return null;

  const cur = index % count;
  const go = (i: number) => setIndex((i + count) % count);

  return (
    <div className="banner" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="banner-track" style={{ transform: `translateX(-${cur * 100}%)` }}>
        {list.map((src, i) => (
          <div className="banner-slide" key={i}>
            <img src={src} alt={`Banner ${i + 1}`} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
        ))}
      </div>

      {count > 1 ? (
        <>
          <button className="banner-btn prev" onClick={() => go(cur - 1)} aria-label="Ảnh trước"><ChevronLeft size={20} /></button>
          <button className="banner-btn next" onClick={() => go(cur + 1)} aria-label="Ảnh sau"><ChevronRight size={20} /></button>
          <div className="banner-dots">
            {list.map((_, i) => (
              <button key={i} className={`banner-dot${i === cur ? ' active' : ''}`} onClick={() => go(i)} aria-label={`Chuyển tới ảnh ${i + 1}`} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
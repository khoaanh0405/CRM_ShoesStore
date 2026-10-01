import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

// 4 ảnh banner tạm (Unsplash). Khi có ảnh thật: chép vào customer/public/banners/
// rồi đổi thành '/banners/banner-1.jpg' ... '/banners/banner-4.jpg'.
export const BANNERS = [
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1600&q=70',
  'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1600&q=70',
  'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1600&q=70',
  'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1600&q=70',
];

/** Banner chỉ chứa ảnh, tự trượt qua từng ảnh, dừng khi rê chuột vào. */
export function BannerCarousel({ images = BANNERS, interval = 4500 }: { images?: string[]; interval?: number }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = images.length;

  useEffect(() => {
    if (paused || count < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), interval);
    return () => clearInterval(timer);
  }, [paused, count, interval]);

  const go = (i: number) => setIndex((i + count) % count);

  return (
    <div className="banner" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="banner-track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {images.map((src, i) => (
          <div className="banner-slide" key={src}>
            <img src={src} alt={`Banner ${i + 1}`} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
        ))}
      </div>

      {count > 1 ? (
        <>
          <button className="banner-btn prev" onClick={() => go(index - 1)} aria-label="Ảnh trước"><ChevronLeft size={20} /></button>
          <button className="banner-btn next" onClick={() => go(index + 1)} aria-label="Ảnh sau"><ChevronRight size={20} /></button>
          <div className="banner-dots">
            {images.map((_, i) => (
              <button key={i} className={`banner-dot${i === index ? ' active' : ''}`} onClick={() => go(i)} aria-label={`Chuyển tới ảnh ${i + 1}`} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
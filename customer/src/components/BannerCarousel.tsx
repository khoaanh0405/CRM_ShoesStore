import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import banner1 from '../../assets/images/Bitis_summer_sandal.png';
import banner2 from '../../assets/images/Juno_Elegance_High_Heels.png';
import banner3 from '../../assets/images/Nike_AirZoom_shoes.png';
import banner4 from '../../assets/images/sneaker_classic_v2_shoes.png';

export const BANNERS = [
  banner1,
  banner2,
  banner3,
  banner4,
];

/** Banner trang chủ, tự trượt qua từng ảnh, dừng khi rê chuột vào. */
export function BannerCarousel({ images, interval = 4500 }: { images?: string[]; interval?: number }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const list = images ?? BANNERS;
  const count = list?.length ?? 0;

  useEffect(() => {
    if (paused || count < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), interval);
    return () => clearInterval(timer);
  }, [paused, count, interval]);

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

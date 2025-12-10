// src/components/CarouselHero.jsx
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const imgs = [
  'https://images.unsplash.com/photo-1516251193007-45ef944ab0c6?q=80&w=1800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=1800&auto=format&fit=crop',
];

export default function CarouselHero() {
  const [i, setI] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    timer.current = setInterval(() => setI((v) => (v + 1) % imgs.length), 4000);
    return () => clearInterval(timer.current);
  }, []);

  return (
    <section className="max-w-screen-2xl mx-auto px-4">
      <div className="relative overflow-hidden rounded-2xl h-52 sm:h-64 md:h-72 lg:h-80 bg-black">
        {imgs.map((src, idx) => (
          <img
            key={src}
            src={src}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${idx === i ? 'opacity-100' : 'opacity-0'
              }`}
            loading="lazy"
          />
        ))}

        {/* CTA */}
        <div className="absolute left-6 top-6 sm:left-8 sm:top-8">
          <Link to="/collection" className="btn-primary">Khám phá</Link>
        </div>

        {/* Dots */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
          {imgs.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              className={`h-2 w-2 rounded-full transition ${idx === i ? 'bg-white' : 'bg-white/40'
                }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

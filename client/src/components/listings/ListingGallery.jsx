import { useState } from 'react'

export function ListingGallery({ images = [], title }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeImage = images[activeIndex] || images[0]

  return (
    <div className="space-y-3">
      <div className="card-surface overflow-hidden p-0">
        <img
          src={activeImage}
          alt={title}
          className="h-80 w-full object-cover transition duration-500 hover:scale-[1.01] sm:h-[420px]"
        />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {images.map((image, index) => (
          <button
            key={image}
            className={`overflow-hidden rounded-xl border transition ${
              index === activeIndex ? 'border-brand-500 shadow-sm' : 'border-slate-200 hover:border-brand-300'
            }`}
            onClick={() => setActiveIndex(index)}
          >
            <img src={image} alt={`${title} ${index + 1}`} className="h-20 w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}

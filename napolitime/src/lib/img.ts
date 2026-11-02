const base = import.meta.env.BASE_URL

/** Responsive WebP sources for a photo in public/img/. */
export function photo(name: string) {
  return {
    src: `${base}img/${name}-1280.webp`,
    srcSet: `${base}img/${name}-640.webp 640w, ${base}img/${name}-1280.webp 1280w`,
  }
}

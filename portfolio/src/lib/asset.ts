/** Prefix a /public path with the configured base path (needed for plain <img>/<link> when served from a sub-folder). */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
export const asset = (path: string) => (/^https?:/.test(path) ? path : `${basePath}${path}`)

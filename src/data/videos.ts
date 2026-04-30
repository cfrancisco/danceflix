/**
 * Backward-compatible shim.
 *
 * All existing components import from this file and continue to work unchanged.
 * The actual data now lives in `src/data/styles/zouk/` and is served through
 * the style registry in `src/data/registry.ts`.
 */
export {
  videos,
  getVideoById,
  getRelatedVideos,
  getVideoThumbnail,
} from './registry'

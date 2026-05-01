/**
 * Backward-compatible shim.
 * All existing components import from this file and continue to work unchanged.
 */
export {
  videos,
  steps,
  getVideoById,
  getRelatedVideos,
  getVideoThumbnail,
} from './registry'

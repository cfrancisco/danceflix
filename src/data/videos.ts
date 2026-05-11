/**
 * Backward-compatible shim.
 * All existing components import from this file and continue to work unchanged.
 */
export {
  steps,
  getVideoById,
  getStepById,
  getRelatedVideos,
  getVideoThumbnail,
  getEffectiveVideos,
  getFirstYoutubeId,
  hasYoutubeVideo,
  getAllVideos,
  getCatalogVideoById,
} from './registry'

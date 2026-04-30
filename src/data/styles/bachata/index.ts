import type { DanceStyle } from '../../types'
import type { Video } from '../../../types'
import { bachataVideos } from './videos'
import { bachataFlowMap } from './flowMap'

/**
 * Bachata — style descriptor.
 * Visual identity: vermelho (#DC2626) e branco.
 */
export const BachataStyle: DanceStyle = {
  id: 'bachata',
  name: 'Bachata',
  description: 'Dança de salão dominicana de movimentos sensuais, com balanço de quadril e conexão próxima ao parceiro.',
  icon: '🌹',
  color: '#DC2626',
  accentColor: '#DC2626',
  videos: bachataVideos.map((v): Video => ({ ...v, styleId: 'bachata' })),
  flowMap: bachataFlowMap,
}

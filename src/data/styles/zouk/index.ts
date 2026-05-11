import type { DanceStyle, DanceStep, Video, Hub, Flow } from '../../types'
import stepsData from './steps.json'
import videosData from './videos.json'
import hubsData from './hubs.json'
import flowsData from './flows.json'

export const ZoukStyle: DanceStyle = {
  id: 'zouk',
  name: 'Zouk',
  description: 'Dança de salão brasileira com movimentos fluidos, ondulações e grande expressão corporal.',
  icon: '🌊',
  color: '#3B82F6',
  accentColor: '#f5a623',
  steps: (stepsData as Omit<DanceStep, 'styleId'>[]).map((v): DanceStep => ({ ...v, styleId: 'zouk' })),
  videos: videosData as Video[],
  flows: flowsData as Flow[],
  hubs: hubsData as Hub[],
}

import type { DanceStyle, DanceStep, Hub, Flow } from '../../../types'
import stepsData from './steps.json'
import hubsData from './hubs.json'
import flowsData from './flows.json'

export const SambaStyle: DanceStyle = {
  id: 'samba',
  name: 'Samba',
  description: 'Dança brasileira vibrante e percussiva, símbolo do Carnaval, com ginga característica e passos animados.',
  icon: '🎭',
  color: '#D97706',
  accentColor: '#059669',
  steps: (stepsData as Omit<DanceStep, 'styleId'>[]).map((s): DanceStep => ({ ...s, styleId: 'samba' })),
  videos: [],
  hubs: hubsData as Hub[],
  flows: flowsData as Flow[],
}

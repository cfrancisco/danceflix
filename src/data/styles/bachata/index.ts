import type { DanceStyle, DanceStep, Hub, Flow } from '../../../types'
import stepsData from './steps.json'
import hubsData from './hubs.json'
import flowsData from './flows.json'

export const BachataStyle: DanceStyle = {
  id: 'bachata',
  name: 'Bachata',
  description: 'Dança de salão dominicana de movimentos sensuais, com balanço de quadril e conexão próxima ao parceiro.',
  icon: '🌹',
  color: '#DC2626',
  accentColor: '#DC2626',
  steps: (stepsData as Omit<DanceStep, 'styleId'>[]).map((s): DanceStep => ({ ...s, styleId: 'bachata' })),
  videos: [],
  hubs: hubsData as Hub[],
  flows: flowsData as Flow[],
}

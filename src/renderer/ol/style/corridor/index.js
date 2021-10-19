import { styles } from '../styles'
import * as TS from '../..//ts'
import './G_G_OAF' // ATTACK BY FIRE POSITION
import './G_G_OLAA' // AXIS OF ADVANCE / AIRBORNE
import './G_G_OLAGM' // AXIS OF ADVANCE / MAIN ATTACK
import './G_G_OLAGS' // AXIS OF ADVANCE / SUPPORTING ATTACK
import './G_G_OLAR' // AXIS OF ADVANCE / ATTACK, ROTARY WING
import './G_G_OLAV' // AXIS OF ADVANCE / AVIATION
import './G_G_OLI' // INFILTRATION LANE
import './G_G_PA' // AXIS OF ADVANCE FOR FEINT
import './G_G_SLA' // AMBUSH
import './G_M_BCA' // ASSAULT CROSSING AREA
import './G_M_BCB' // BRIDGE OR GAP
import './G_M_BCD' // TACGRP.MOBSU.OBSTBP.CSGSTE.FRDDFT - FORD DIFFICULT
import './G_M_BCE' // TACGRP.MOBSU.OBSTBP.CSGSTE.FRDESY - FORD EASY
import './G_M_BDD' // TACGRP.MOBSU.OBSTBP.DFTY.DFT - BYPASS DIFFICULT
import './G_M_BDE' // TACGRP.MOBSU.OBSTBP.DFTY.ESY - BYPASS EASY
import './G_M_BDI' // TACGRP.MOBSU.OBSTBP.DFTY.IMP - BYPASS IMPOSSIBLE
import './G_M_OEB' // TACGRP.MOBSU.OBST.OBSEFT.BLK - OBSTACLE EFFECT / BLOCK
import './G_M_OFG' // MINEFIELDS / GAP
import './G_M_ORA' // TACGRP.MOBSU.OBST.RCBB.ABP - BLOWN BRIDGES / ARMED-BUT PASSABLE
import './G_M_ORC' // TACGRP.MOBSU.OBST.RCBB.EXCD - BLOWN BRIDGES / EXECUTED
import './G_M_ORP' // TACGRP.MOBSU.OBST.RCBB.PLND - BLOWN BRIDGES / PLANNED
import './G_M_ORS' // TACGRP.MOBSU.OBST.RCBB.SAFE - BLOWN BRIDGES / SAFE
import './G_T_B' // TASKS / BLOCK
import './G_T_C' // TASKS / CANALIZE
import './G_T_H' // TASKS / BREACH
import './G_T_J' // TASKS / CONTAIN
import './G_T_K' // COUNTERATTACK (CATK)
import './G_T_KF' // COUNTERATTACK BY FIRE
import './G_T_L' // TASKS / DELAY, RETIREMENT, WITHDRAW (UNDER PRESSURE)
import './G_T_P' // TASKS / PENETRATE
import './G_T_R' // TASKS / RELIEF IN PLACE (RIP)
import './G_T_T' // TASKS / DISRUPT
import './G_T_X' // TASKS / CLEAR
import './G_T_Y' // TASKS / BYPASS

styles['LineString:Point:DEFAULT'] = ({ geometry }) => [{ id: 'style:default', geometry }]

styles['LineString:Point:ERROR'] = context => {
  const [lineString, point] = TS.geometries(context.geometry)
  const width = TS.segment([TS.startPoint(lineString), point].map(TS.coordinate)).getLength()
  const geometry = TS.lineBuffer(lineString)(width)
  return [{ id: 'style:wasp-stroke', geometry }]
}

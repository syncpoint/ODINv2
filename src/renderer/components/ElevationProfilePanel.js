import React from 'react'
import Icon from '@mdi/react'
import { mdiClose } from '@mdi/js'
import { useServices } from './hooks'
import { ElevationChart } from './ElevationChart'
import './ElevationProfilePanel.css'

const formatDistance = meters => {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

const computeStats = (profile) => {
  const elevations = profile.map(p => p.elevation).filter(e => e != null)
  if (elevations.length === 0) return null

  const min = Math.min(...elevations)
  const max = Math.max(...elevations)
  const totalDistance = profile[profile.length - 1].distance

  let ascent = 0
  let descent = 0
  for (let i = 1; i < profile.length; i++) {
    if (profile[i].elevation == null || profile[i - 1].elevation == null) continue
    const diff = profile[i].elevation - profile[i - 1].elevation
    if (diff > 0) ascent += diff
    else descent += Math.abs(diff)
  }

  return {
    min: Math.round(min),
    max: Math.round(max),
    totalDistance,
    ascent: Math.round(ascent),
    descent: Math.round(descent)
  }
}

export const ElevationProfilePanel = () => {
  const { emitter } = useServices()
  const [profileData, setProfileData] = React.useState(null)
  const [segmentDistances, setSegmentDistances] = React.useState([])

  React.useEffect(() => {
    const handleShow = ({ profile, segmentDistances }) => {
      setProfileData(profile)
      setSegmentDistances(segmentDistances || [])
    }
    const handleHide = () => {
      setProfileData(null)
      setSegmentDistances([])
    }

    emitter.on('elevation-profile/show', handleShow)
    emitter.on('elevation-profile/hide', handleHide)
    return () => {
      emitter.off('elevation-profile/show', handleShow)
      emitter.off('elevation-profile/hide', handleHide)
    }
  }, [emitter])

  const handleHover = React.useCallback((index) => {
    if (index == null || !profileData) {
      emitter.emit('elevation-profile/hover', { coordinate: null })
    } else {
      emitter.emit('elevation-profile/hover', { coordinate: profileData[index].coordinate })
    }
  }, [emitter, profileData])

  const handleClose = React.useCallback(() => {
    emitter.emit('elevation-profile/hide')
  }, [emitter])

  if (!profileData) return null

  const stats = computeStats(profileData)

  return (
    <div className='elevation-profile-panel'>
      <div className='elevation-profile-panel__header'>
        <span className='elevation-profile-panel__title'>Elevation Profile</span>
        { stats && (
          <div className='elevation-profile-panel__stats'>
            <span>Min: {stats.min} m</span>
            <span>Max: {stats.max} m</span>
            <span>Dist: {formatDistance(stats.totalDistance)}</span>
            <span>&uarr; {stats.ascent} m</span>
            <span>&darr; {stats.descent} m</span>
          </div>
        )}
        <button className='elevation-profile-panel__close' onClick={handleClose}>
          <Icon path={mdiClose} size='18px' />
        </button>
      </div>
      <ElevationChart data={profileData} segmentDistances={segmentDistances} onHover={handleHover} />
    </div>
  )
}

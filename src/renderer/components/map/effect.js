export default options => {
  const {
    services,
    ref,
    symbolPropertiesShowing,
    ol,
    ScaleLine,
    Rotate,
    defaultInteractions,
    vectorSources,
    createMapView,
    createLayerStyles,
    createVectorLayers,
    createTileLayers,
    registerEventHandlers,
    registerGraticules,
    measure,
    print
  } = options

  return () => {
    let map
    let observer

    ;(async () => {
      const view = await createMapView(services)
      const sources = await vectorSources({ ...services, symbolPropertiesShowing })
      const styles = createLayerStyles(services, sources)
      const vectorLayers = createVectorLayers(sources, styles)

      const controlsTarget = document.getElementById('osd')
      const controls = [
        new Rotate({ target: controlsTarget }),
        new ScaleLine({ bar: true, text: true, minWidth: 128, target: controlsTarget })
      ]

      const tileLayers = await createTileLayers(services)
      const layers = [...tileLayers, ...Object.values(vectorLayers)]

      map = new ol.Map({
        target: 'map',
        controls,
        layers,
        view,
        interactions: []
      })

      defaultInteractions({
        hitTolerance: 3,
        map,
        services,
        sources,
        styles
      })

      registerEventHandlers({ services, sources, vectorLayers, map })
      registerGraticules({ services, map })
      print({ map, services })

      observer = new ResizeObserver(() => map.updateSize())
      observer.observe(ref.current)

      measure({ services, map })
    })()

    return () => {
      if (observer) observer.disconnect()
      if (map) map.dispose()
    }
  }
}


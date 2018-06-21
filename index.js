const config = require('config')
const filelist = require('node-filelist')
const readline = require('readline')
const fs = require('fs')
const tilebelt = require('@mapbox/tilebelt')

let dict = {}
let geojsons = {}
const z = config.get('z')

const work = (path, last) => {
  readline.createInterface({
    input: fs.createReadStream(path, 'utf-8')
  }).on('line', line => {
    let tile = line.split('/').map(v => parseInt(v)) // zxy
    tile = [tile[1], tile[2], tile[0]] // xyz
    while (tile[2] > z) {
      tile = tilebelt.getParent(tile)
    } 
    const geojson = tilebelt.tileToGeoJSON(tile)
    tile = [tile[2], tile[0], tile[1]].join('/') // zxy
    if (dict[tile]) {
      dict[tile] += 1
    } else {
      dict[tile] = 1
      geojsons[tile] = geojson
    }
  }).on('close', () => {
    if (!last) return
    let result = {
      type: 'FeatureCollection',
      features: []
    }
    for (let tile of Object.keys(dict)) {
      result.features.push({
        type: 'Feature',
        geometry: geojsons[tile],
        properties: {tile: tile, count: dict[tile]}
      })
    }
    console.log(JSON.stringify(result, null, 2))
  })
}

filelist.read([config.get('dir')], {}, r => {
  for (let i = 0; i < r.length; i++) {
    work(r[i].path, i == r.length - 1)
  }
})

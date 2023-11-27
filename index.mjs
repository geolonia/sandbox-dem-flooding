const map = new window.geolonia.Map('#map')
const slider = document.getElementById('slider')
const sliderValue = document.getElementById('slider-value')

const layerProps = {
    data: 'https://cyberjapandata.gsi.go.jp/xyz/demgm_png/{z}/{x}/{y}.png',
    minZoom: 5,
    maxZoom: 7,
    tileSize: 256,
    sea_level: 0,
    renderSubLayers: props => {
      console.log('render', props)
      const { bbox: { west, south, east, north } } = props.tile;
      const { sea_level } = props
      const imageBitmap = props.data // typeof ImageBitmap
      const canvas = document.createElement('canvas');
      canvas.width = imageBitmap.width;
      canvas.height = imageBitmap.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imageBitmap, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      console.time(props.id)

        for (let index = 0; index < imageData.data.length; index+= 4) {
          const r = imageData.data[index]
          const g = imageData.data[index + 1]
          const b = imageData.data[index + 2]
          const alt = r > 127.99 ? 0 : (r * 256 * 256 + g * 256 + b) / 100

          imageData.data[index] = 0
          imageData.data[index + 1] = 0
          imageData.data[index + 2] = 256
          imageData.data[index + 3] = 0

          if (alt <= sea_level) {
            imageData.data[index + 3] = 128
          }
        }
      console.timeEnd(props.id)

      return new deck.BitmapLayer(props, {
          data: null,
          image: imageData,
          bounds: [west, south, east, north]
      });
  }
}

let timer = null
const throttle = (callback) => {
  if (timer) {
    clearTimeout(timer)
  }
  timer = setTimeout(() => {
    callback()
    timer = null
  }, 2)
}

map.once('load', () => {
  const overlay = new deck.MapboxOverlay({
    layers: [new deck.TileLayer(layerProps)],
  })
  map.addControl(overlay)

  slider.addEventListener('input', (e) => {
    const sea_level = parseInt(e.target.value, 10)
    sliderValue.innerText = sea_level + 'm'

    throttle(() => overlay.setProps({ layers: [new deck.TileLayer({ ...layerProps, sea_level })] }))
  })
})

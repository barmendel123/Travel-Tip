import { locService } from './services/loc.service.js'
import { mapService } from './services/map.service.js'
import { weatherService } from './services/weather.service.js'

// export const appController = {
//     onAddLocation
// }

window.onload = onInit
window.onAddMarker = onAddMarker
window.onPanTo = onPanTo
window.onGetUserPos = onGetUserPos
window.onRemoveLoc = onRemoveLoc
window.onSearchLocation = onSearchLocation
window.onCopyLink = onCopyLink
window.useWeatherData = useWeatherData

function onInit() {
    mapService.initMap()
        .then(map => addMapListener(map))
        .then(() => {
            console.log('Map is ready')
            _setLocationByQueryParams()
            _renderLocs()
            useWeatherData()
        })
        .catch(() => console.log('Error: cannot init map'))
}

function addMapListener(map) {
    map.addListener('click', (mapsMouseEvent) => {

        Swal.fire({
            input: 'text',
            icon: 'question',
            title: 'Enter the name location',
            inputPlaceholder: 'My favorite sunset spot',
            showCloseButton: true
        }).then((res) => {
            if (res.isConfirmed) {
                Swal.fire({
                    position: 'top-end',
                    icon: 'success',
                    title: 'Location Saved',
                    showConfirmButton: false,
                    timer: 1000
                })
                return res.value
            }
            return null
        }).then((locationName) => {
            if (!locationName) return
            const lat = mapsMouseEvent.latLng.lat()
            const lng = mapsMouseEvent.latLng.lng()
            const pos = { lat, lng }
            onAddLocation(locationName, pos)
            mapService.placeMarkerAndPanTo(lat, lng)
        })

    })
}

// This function provides a Promise API to the callback-based-api of getCurrentPosition
function getPosition() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject)
    })
}

function onAddMarker(lat, lng) {
    mapService.addMarker({ lat, lng })
}

function useWeatherData() {
    getPosition()
        .then(pos => {
            const { latitude, longitude } = pos.coords
            return weatherService.getWeather(latitude, longitude)
            // .then(_renderWeatherData)
        })
        .then(_renderWeatherData)
}


function _renderWeatherData({ temp, feelsLike, humidity, description, name }) {
    const strHTML = `
    <h1>${name}</h1>
    <p>${description}</p>
    <p>Humidity ${humidity}%</p>
    <p>Temp ${temp}℃</p>
    <p>Feels like ${feelsLike}℃</p>
    `
    document.querySelector('.weather-container').innerHTML = strHTML
}

function onSearchLocation(ev, elForm) {
    ev.preventDefault()
    const locationName = elForm.querySelector('[name=locations-input]').value
    locService.searchLocation(locationName)
        .then(res => {
            const { lat, lng, name } = res
            onAddLocation(name, { lat, lng })
            onPanTo(lat, lng)
        })
}

function onGetUserPos() {
    getPosition()
        .then(pos => {
            const { latitude, longitude } = pos.coords
            onPanTo(latitude, longitude)
            onAddMarker(latitude, longitude)
            document.querySelector('.user-pos').innerText =
                `Latitude: ${pos.coords.latitude} - Longitude: ${pos.coords.longitude}`
        })
        .catch(err => {
            console.log('err!!!', err)
        })
}

function _setLocationByQueryParams() {
    // console.log('window.location.search', window.location.search);
    const queryStringParams = new URLSearchParams(window.location.search)
    const lat = +queryStringParams.get('lat')
    const lng = +queryStringParams.get('lng')
    if (lat && lng) mapService.placeMarkerAndPanTo(lat, lng)
}

function onCopyLink(lat, lng) {
    const queryStringParams = `?lat=${lat}&lng=${lng}`
    const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + queryStringParams
    // const data = [new ClipboardItem({ "text/plain": new Blob([newUrl], { type: "text/plain" }) })]
    // navigator.clipboard.write(data)
    navigator.clipboard.writeText(newUrl)
        .then(() => {
            console.log("Copied to clipboard successfully!")
        }, () => {
            console.error("Unable to write to clipboard. :-(")
        })
}

function onPanTo(lat, lng) {
    mapService.panTo(lat, lng)
    onAddMarker(lat, lng)
}

function onAddLocation(locationName, pos) {
    locService.addLocation(locationName, pos)
    _renderLocs()
}

function onRemoveLoc(locId) {
    console.log('onRemoveLoc ~ locId', locId)
    locService.removeLoc(locId)
    _renderLocs()
}

function _renderLocs() {
    locService.getLocs()
        .then(locs => {
            const strHTMLs = locs.map(loc => `
            <tr>
                <td>${loc.name}</td>
                <td>${loc.lat.toFixed(3)}</td>
                <td>${loc.lng.toFixed(3)}</td>
                <td>
                <button class="btn btn-delete" onclick="onRemoveLoc('${loc.id}')">Delete</button>
                <button class="btn btn-go" onclick="onPanTo(${loc.lat}, ${loc.lng})">Go</button>
                <button class="btn btn-copy" onclick="onCopyLink(${loc.lat}, ${loc.lng})">Copy</button>
                </td>
            </tr>
            `)
            document.querySelector('.locs-body').innerHTML = strHTMLs.join('')
        })
}
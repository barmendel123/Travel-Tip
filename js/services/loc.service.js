import { utilService } from './utils.services.js'
import { storageService } from './storage.services.js'

export const locService = {
    getLocs,
    addLocation,
    removeLoc,
    searchLocation
}

const STORAGE_KEY = 'locsDB'


const locs = _loadLocsFromStorage() || []

function getLocs() {
    return Promise.resolve(locs)
    // return new Promise((resolve, reject) => {
    //     setTimeout(() => {
    //         resolve(locs)
    //     }, 2000)
    // })
}

function searchLocation(locationName) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${locationName}&key=AIzaSyDJOS8Lw2pOyAk7dwu1HRePE9DHKTIiAE4`
    return axios.get(url)
        .then(res => res.data.results[0])
        .then(res => {
            return {
                name: res.formatted_address,
                lat: res.geometry.location.lat,
                lng: res.geometry.location.lng
            }
        })
}

function addLocation(name, pos) {
    const location = _createLocation(name, pos)
    locs.push(location)
    _saveLocsSaveToStorage()
}

function removeLoc(locId) {
    const locIdx = locs.findIndex(loc => loc.id === locId)
    locs.splice(locIdx, 1)
    _saveLocsSaveToStorage()
}

function _createLocation(name, { lat, lng }) {
    return {
        id: utilService.makeId(4),
        name,
        lat,
        lng
    }
}

function _saveLocsSaveToStorage() {
    storageService.saveToStorage(STORAGE_KEY, locs)
}

function _loadLocsFromStorage() {
    return storageService.loadFromStorage(STORAGE_KEY)
}



"use strict";

const form = document.querySelector(".form");
const inputLatitude = document.querySelector(".form__input--latitude");
const inputLongitude = document.querySelector(".form__input--longitude");
const btnCurrent = document.querySelector(".btn--current");
const btnSearch = document.querySelector(".btn--search");
const btnGlobal = document.querySelector(".btn--global");
const containerLocations = document.querySelector(".container");

class App {
  #map;
  #zoomLevel = 15;
  #mapEvent;
  #activeMarker;

  constructor() {
    this._getPosition();

    btnGlobal.addEventListener("click", this._globalView.bind(this));
  }

  // Get current position from geolocation API
  _getPosition = function () {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position.coords),
        (error) => {
          this._loadMap({ latitude: 0, longitude: 0 }, 2); // Default Coords
          throw new Error(
            `Could not get position, try again (${error.message})`
          );
        }
      );
    })
      .then((coords) => this._loadMap(coords, this.#zoomLevel))
      .catch((error) => {
        this._renderError(`Something went wrong!:( (${error.message})`);
      });
  };

  _renderError = function (msg) {
    console.log(msg);
  };

  // Load map in current position
  _loadMap = function (location, zoomLevel) {
    const { latitude } = location;
    const { longitude } = location;

    // Create map with defined bounds (top corner and bot corner)
    this.#map = L.map("map", {
      maxBounds: [
        // Render current position
        [180, -180],
        [-180, 180],
      ],
    }).setView([latitude, longitude], zoomLevel); // Set initial view on current position

    // Map style
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this._renderMarker([latitude, longitude]);
    // event listener for clicks on map
    this.#map.on("click", this._renderLocation.bind(this));
  };

  _renderLocation(mapE) {
    this.#mapEvent = mapE;
    const { lat, lng } = this.#mapEvent.latlng;

    // Remove active marker
    this._removeMarker();

    // Drag view to marker
    this.#map.setView([lat, lng], this.#zoomLevel, {
      animate: true,
      pan: { duration: 1 },
    });

    // Render marker on clicked location
    this._renderMarker([lat, lng]);

    // Get information based on coords
    this._getLocationData(lat, lng);
  }

  _getLocationData(lat, lng) {}

  _renderMarker = function (location) {
    this.#activeMarker = L.marker(location).addTo(this.#map);
  };

  _removeMarker = function () {
    this.#activeMarker.remove();
  };

  _globalView() {
    this.#map.setView([0, 0], 2);
  }
}

const app = new App();

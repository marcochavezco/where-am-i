"use strict";

const form = document.querySelector(".form");
const inputLatitude = document.querySelector(".form__input--latitude");
const inputLongitude = document.querySelector(".form__input--longitude");
const btnCurrent = document.querySelector(".btn--current");
const btnSearch = document.querySelector(".btn--search");
const btnGlobal = document.querySelector(".btn--global");
const containerLocations = document.querySelector(".container");

// Render current position

class App {
  #map;

  constructor() {
    this._getPosition();
  }

  // Get current position
  _getPosition = function () {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position.coords),
        (error) => {
          this._loadMap({ latitude: 0, longitude: 0 }, 2);
          throw new Error(
            `Could not get position, try again (${error.message})`
          );
        }
      );
    })
      .then((coords) => this._loadMap(coords, 15))
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
    this.#map = L.map("map").setView([latitude, longitude], zoomLevel);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this._renderMarker([latitude, longitude]);
  };

  _globalView(location) {
    this.#map.setZoomAround([23.653767, -100.6377605], 2);
  }
  _renderMarker = function (location) {
    L.marker(location)
      .addTo(this.#map)
      .bindPopup("A pretty CSS3 popup.<br> Easily customizable.")
      .openPopup();
  };
}

const app = new App();

"use strict";

const form = document.querySelector(".form");
const inputLatitude = document.querySelector(".form__input--latitude");
const inputLongitude = document.querySelector(".form__input--longitude");
const btnCurrent = document.querySelector(".btn--current");
const btnSearch = document.querySelector(".btn--search");
const btnGlobal = document.querySelector(".btn--global");
const containerLocations = document.querySelector(".container");
const locations = document.querySelector(".locations");
const errorText = document.querySelector(".error");

class App {
  #map;
  #zoomLevel = 10;
  #mapEvent;
  #activeMarker;
  #recentLocation;

  constructor() {
    this._getPosition();

    btnGlobal.addEventListener("click", this._globalView.bind(this));
  }

  // Get current position from geolocation API
  _getPosition = function () {
    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        position => resolve(position.coords),

        error => {
          // Load map in default coords when geolocation failed
          this._loadMap({ latitude: 0, longitude: 0 }, 2);

          const errorMsg = "Could not get position, try again!";
          this._renderError(errorMsg);
          throw new Error(
            `Could not get position, try again (${error.message})`
          );
        }
      );
    })
      .then(coords => this._loadMap(coords, this.#zoomLevel))
      .catch(error => {
        this._renderError(`${error.message}`);
        console.log(`Something went wrong!:( (${error.message})`);
      });
  };

  _renderError = function (msg) {
    errorText.value = "Hello";
    errorText.classList.remove("hidden");
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

    // render current location

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

  _getLocationData(lat, lng) {
    let city;

    // Reverse geocodin from clicked location
    this._getJSON(
      `https://geocode.xyz/${lat},${lng}?geoit=json`,
      "Response number are limit to 1 request per second, try again"
    )
      .then(data => {
        if (data.matches === null)
          throw new Error("No matches found. Try other place, please");

        city = data.city[0] + data.city.slice(1).toLowerCase();
        const country = data.prov; // ex. MX, USA, JP

        if (!data) throw new Error(`Location not found ${data.status}`);
        if (!data.city) throw new Error(`City not found ${data.city}`);

        // Does not render location if recentLocation === city
        if (this.#recentLocation === city)
          throw new Error(`Location already displayed`);
        this.#recentLocation = city;

        // Get country data
        return this._getJSON(
          `https://restcountries.com/v2/alpha/${country}`,
          "Could not get country information"
        );
      })
      .then(countryData => this._renderData(city, countryData, lat, lng))
      .catch(error => console.log(error.message));
  }

  _getJSON(url, errorMsg) {
    return fetch(url).then(response => {
      if (!response.ok) throw new Error(`${errorMsg} (${response.status})`);
      return response.json();
    });
  }

  _renderData(city, country, lat, lng) {
    const html = `
    <li class="location" data-id="${lat},${lng}">
      <article class="location__country">
        <h3 class="location__name">${city}, ${country.name}</h3>
        <img class="country__img" src="${country.flag}" />
        <div class="country__data">
          <h4 class="country__region">${country.region}</h4>
          <p class="country__row"><span>👫</span>  ${(
            country.population / 1000000
          ).toFixed(1)} M</p>
          <p class="country__row"><span>🗣️</span>  ${
            country.languages[0].name
          }</p>
          <p class="country__row"><span>💰</span>  ${
            country.currencies[0].name
          }</p>
        </div>
      </article>
    </li>
    `;
    locations.insertAdjacentHTML("afterbegin", html);
  }

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

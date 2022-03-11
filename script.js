"use strict";

const form = document.querySelector(".form");
const inputLatitude = document.querySelector(".form__input--latitude");
const inputLongitude = document.querySelector(".form__input--longitude");
const btnForm = document.querySelector(".form__btn");
const btnCurrent = document.querySelector(".btn--current");
const btnSearch = document.querySelector(".btn--search");
const btnGlobal = document.querySelector(".btn--global");
const btnRow = document.querySelector(".btn__row");

const containerLocations = document.querySelector(".container");
const locations = document.querySelector(".locations");
const statusText = document.querySelector(".status");

const mapEl = document.querySelector("#map");

class App {
  #map;
  #zoomLevel = 10;
  #activeMarker;
  #recentLocation;

  constructor() {
    this._renderInitialPosition();

    form.addEventListener("submit", this._searchLocation.bind(this));
    btnSearch.addEventListener("click", this._searchLocation.bind(this));

    btnCurrent.addEventListener(
      "click",
      this._renderCurrentPosition.bind(this)
    );

    btnGlobal.addEventListener("click", this._globalView.bind(this));
  }

  // Get current position from geolocation API
  _renderInitialPosition = function () {
    new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        position => resolve(position.coords),

        error => {
          this._createMap(0, 0, 2); // Create map in default coords when geolocation failed
          const errorMsg = `Could not get position (${error.message})`;
          this._renderStatus(errorMsg);
          throw new Error(errorMsg);
        }
      );
    })
      .then(coords => {
        this._renderInitialMapPosition(coords, this.#zoomLevel); // Render map on current position then render position data
      })
      .catch(error => {
        this._renderStatus(`${error.message}`);
        console.log(`Something went wrong!:( (${error.message})`);
      });
  };

  _createMap = function (lat, lng, zoomLevel) {
    // Create map with defined bounds (top corner and bot corner)
    this.#map = L.map("map", {
      maxBounds: [
        [180, -180],
        [-180, 180],
      ],
    }).setView([lat, lng], zoomLevel); // Set initial view on current position (0,0 when geolocation failed)

    // Map style
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Event listener for clicks on map, it returns a map event (mapE)
    this.#map.on("click", this._renderLocation.bind(this));
  };

  // Load map and render current position
  _renderInitialMapPosition = function (location, zoomLevel) {
    const { latitude, longitude } = location;

    this._createMap(latitude, longitude, zoomLevel);

    // Render marker on initial location
    this._renderMarker([latitude, longitude]);

    // Render current location
    const mapE = { latlng: { lat: latitude, lng: longitude } };
    this._renderLocation(mapE);
  };

  _renderLocation(mapE) {
    const { lat, lng } = mapE.latlng;

    // Remove active marker
    if (this.#activeMarker) this._removeMarker();

    // Drag view to new location
    this.#map.setView([lat, lng], this.#zoomLevel, {
      animate: true,
      pan: { duration: 1 },
    });

    // Render marker on clicked/searched location
    this._renderMarker([lat, lng]);

    // Get information based on coords
    this._getLocationData(lat, lng);

    this._hideForm();
  }

  _getLocationData(lat, lng) {
    let city;
    let country;

    // Reverse geocoding from clicked/searched location
    this._getJSON(
      `https://geocode.xyz/${lat},${lng}?geoit=json`,
      "Response number limit to 1 request per second, try again!"
    )
      .then(data => {
        if (data.matches === null)
          throw new Error("No matches found. Try another place!");
        if (!data) throw new Error(`Location not found`);
        if (!data.city)
          throw new Error(
            `For better results and location information use accurate coordinates`
          );

        city = `
        ${data.city[0].toUpperCase()}${data.city.slice(1).toLowerCase()}
          `;
        country = data.prov; // ex. MX, USA, JP

        // Does not render location if previous location === new location
        if (this.#recentLocation === city)
          throw new Error("Location already displayed, try another!");
        this.#recentLocation = city;

        // Get country data
        return this._getJSON(
          `https://restcountries.com/v2/alpha/${country}`,
          "Could not get country information"
        );
      })
      .then(countryData => this._renderData(city, countryData, lat, lng))
      .catch(error => {
        this._renderStatus(error.message);
        console.log(error.message);
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

  _searchLocation = function (e) {
    e.preventDefault();

    // Allow to use search button to open form, then search location
    if (form.classList.contains("hidden")) {
      btnRow.style.borderRadius = "0 0 1rem 1rem";
      btnRow.style.backgroundColor = "var(--color-dark--2)";
      form.classList.remove("hidden");
      return;
    }

    const lat = inputLatitude.value;
    const lng = inputLongitude.value;

    // RegEx to filter user input
    const r = /^[ ]*?(-?\d+\.?\d*)[ ]*$/i;

    if (!lat.match(r) && !lng.match(r)) {
      const errorMsg = "Use valid coords, please";
      this._renderStatus(errorMsg);
      throw Error(errorMsg);
    }

    const mapE = { latlng: { lat: lat, lng: lng } };
    this._renderLocation(mapE);

    this._hideForm();
  };

  _renderCurrentPosition = function (e) {
    e.preventDefault();

    const current = new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        position => resolve(position.coords),

        error => {
          this._renderStatus(
            `Could not get position, try again! (${error.message})`
          );
        }
      );
    }).then(coords => {
      return {
        latlng: { lat: coords.latitude, lng: coords.longitude },
      };
    });

    current.then(mapE => this._renderLocation(mapE));

    this._hideForm();
  };

  _hideForm = function () {
    form.classList.add("hidden");
    btnRow.style.borderRadius = "1rem";
    btnRow.style.backgroundColor = "var(--color-dark--1)";
    inputLatitude.value = inputLongitude.value = "";
  };

  _renderStatus = function (msg) {
    // Render text on sidebar
    statusText.classList.remove("hidden");
    statusText.innerHTML = msg;

    mapEl.addEventListener("click", _ => statusText.classList.add("hidden"));
    btnSearch.addEventListener("click", _ =>
      statusText.classList.add("hidden")
    );
  };

  _renderMarker = function (location) {
    this.#activeMarker = L.marker(location).addTo(this.#map);
  };

  _removeMarker = function () {
    this.#activeMarker.remove();
  };

  _globalView() {
    this.#map.setView([0, 0], 2);
    this._hideForm();
  }

  _getJSON(url, errorMsg) {
    return fetch(url).then(response => {
      if (!response.ok) throw new Error(errorMsg);
      return response.json();
    });
  }
}

const app = new App();

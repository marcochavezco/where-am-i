"use strict";

const form = document.querySelector(".form");
const inputLatitude = document.querySelector(".form__input--latitude");
const inputLongitude = document.querySelector(".form__input--longitude");
const btnCurrent = document.querySelector(".btn--current");
const btnSearch = document.querySelector(".btn--search");
const containerLocations = document.querySelector(.'container');

const _getPosition = new Promise(function (resolve, reject) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      resolve(position.coords);
    },
    (error) => {
      throw new Error(`Could not get position, try again (${error.message})`);
    }
  );
});

const loadMap = function (position) {
  const { latitude } = position;
  const { longitude } = position;

  const map = L.map("map").setView([latitude, longitude], 15);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  L.marker([latitude, longitude])
    .addTo(map)
    .bindPopup("A pretty CSS3 popup.<br> Easily customizable.")
    .openPopup();
};

const renderError = function (msg) {
  // TODO
};

_getPosition
  .then((position) => {
    loadMap(position);
  })
  .catch((error) => {
    `${error}`;
    renderError("Something went wrong!:(");
  });

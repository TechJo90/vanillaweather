const CONFIG = {
  API_KEY: "b2a5adcct04b33178913oc335f405433",
  API_BASE_URL: "https://api.shecodes.io/weather/v1",
  DEFAULT_CITY: "Paris",
  DEBOUNCE_DELAY: 300,
};

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function formatDate(timestamp) {
  const date = new Date(timestamp * 1000);
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const day = days[date.getDay()];
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day} ${hours}:${minutes}`;
}

const elements = {
  searchForm: document.querySelector("#search-form"),
  searchInput: document.querySelector("#search-form-input"),
  searchSuggestions: document.querySelector("#search-suggestions"),
  errorMessage: document.querySelector("#error-message"),
  city: document.querySelector("#city"),
  time: document.querySelector("#time"),
  description: document.querySelector("#description"),
  humidity: document.querySelector("#humidity"),
  windSpeed: document.querySelector("#wind-speed"),
  temperature: document.querySelector("#temperature"),
  icon: document.querySelector("#icon"),
};

async function fetchWeatherData(city) {
  try {
    const response = await axios.get(
      `${CONFIG.API_BASE_URL}/current?query=${encodeURIComponent(city)}&key=${
        CONFIG.API_KEY
      }`
    );

    if (response.data.city) {
      updateWeatherUI(response.data);
      hideError();
    } else {
      throw new Error("City not found");
    }
  } catch (error) {
    showError("City not found. Please try another location.");
    console.error("Weather API Error:", error);
  }
}

async function fetchCitySuggestions(query) {
  try {
    const response = await axios.get(
      `${CONFIG.API_BASE_URL}/search?query=${encodeURIComponent(query)}&key=${
        CONFIG.API_KEY
      }`
    );
    return response.data.slice(0, 5);
  } catch (error) {
    console.error("Search API Error:", error);
    return [];
  }
}

function updateWeatherUI(data) {
  elements.city.innerHTML = data.city;
  elements.time.innerHTML = formatDate(data.time);
  elements.description.innerHTML = data.condition.description;
  elements.humidity.innerHTML = `${data.temperature.humidity}%`;
  elements.windSpeed.innerHTML = `${Math.round(data.wind.speed)} km/h`;
  elements.temperature.innerHTML = Math.round(data.temperature.current);
  elements.icon.innerHTML = `<img src="${data.condition.icon_url}" alt="${data.condition.description}" />`;
}

function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorMessage.style.display = "block";
}

function hideError() {
  elements.errorMessage.style.display = "none";
}

function updateSuggestions(suggestions) {
  elements.searchSuggestions.innerHTML = "";

  if (suggestions.length > 0) {
    suggestions.forEach((suggestion) => {
      const div = document.createElement("div");
      div.className = "suggestion-item";
      div.textContent = suggestion.city;
      div.addEventListener("click", () => {
        elements.searchInput.value = suggestion.city;
        elements.searchSuggestions.style.display = "none";
        fetchWeatherData(suggestion.city);
      });
      elements.searchSuggestions.appendChild(div);
    });
    elements.searchSuggestions.style.display = "block";
  } else {
    elements.searchSuggestions.style.display = "none";
  }
}

async function handleSearchSubmit(event) {
  event.preventDefault();
  const city = elements.searchInput.value.trim();
  if (city) {
    elements.searchSuggestions.style.display = "none";
    await fetchWeatherData(city);
  }
}

const handleSearchInput = debounce(async (event) => {
  const query = event.target.value.trim();
  if (query.length >= 2) {
    const suggestions = await fetchCitySuggestions(query);
    updateSuggestions(suggestions);
  } else {
    elements.searchSuggestions.style.display = "none";
  }
}, CONFIG.DEBOUNCE_DELAY);

elements.searchForm.addEventListener("submit", handleSearchSubmit);
elements.searchInput.addEventListener("input", handleSearchInput);
document.addEventListener("click", (event) => {
  if (!elements.searchSuggestions.contains(event.target)) {
    elements.searchSuggestions.style.display = "none";
  }
});

document.addEventListener("DOMContentLoaded", () => {
  fetchWeatherData(CONFIG.DEFAULT_CITY);
});

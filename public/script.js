const inputBox = document.getElementById("city-input");
const searchBtn = document.getElementById("searchButton");
const weather_img = document.getElementById("weather-img");
const temperature = document.getElementById("temperature");
const weather_description = document.getElementById("description");
const humidity = document.getElementById("humidity");
const wind_speed = document.getElementById("wind-speed");
const loader = document.getElementById("loader");
const weatherBody = document.getElementById("weather-box");
const weatherDescriptionImage = document.getElementById("weather-description-image");
const cityDetails = document.getElementById("city-name");
const errorCase = document.getElementById("error-case");

function updateTimeInfo() {
    const timeInfoDiv = document.getElementById("time-information");

    const date = new Date();
    const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: "true",
    }
    timeInfoDiv.textContent = date.toLocaleDateString([], options).replace(" at ", "  ");
}
let timeInterval;

function createNewImageElement(src, alt) {
    const img = document.createElement("img");
    img.src = src;
    img.alt = alt;
    return img;
}


function clearWeatherDetails() {
    if (temperature && temperature.textContent) temperature.textContent = "";
    if (weather_description && weather_description.textContent) weather_description.textContent = "";
    if (humidity && humidity.textContent) humidity.textContent = "";
    if (wind_speed && wind_speed.textContent) wind_speed.textContent = "";
    if (cityDetails && cityDetails.textContent) cityDetails.textContent = "";
    if (weather_img) weather_img.style.display = "none";
}


async function checkWeather(city) {
    const url = `/api/weather?city=${city}`;
    loader.style.display = "block";
    weatherBody.style.display = "none";

    try {
        const response = await fetch(url);
        if (!response.ok) {
            if (response.status === 400) {
                throw new Error("City name is required. Please provide a valid city name.");
            } else if (response.status === 404) {
                throw new Error("City not found. Please check the city name and try again.");
            } else {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
        }
        let weather_data = await response.json();

        clearWeatherDetails();
        if(errorCase) errorCase.innerHTML = "";

        let cityName = weather_data.name;
        const cityImgTag = createNewImageElement("/assets/location.svg", "location-icon");
        cityDetails.append(cityImgTag, document.createTextNode(`${cityName}`));

        let tempCelsius = (weather_data.main.temp - 273.15).toFixed(1);
        let tempImgTag;
        if(tempCelsius <= 16) {
            tempImgTag = createNewImageElement("/assets/temperature_low.svg", "cold-weather-temperature");
        }else if(tempCelsius > 16 && tempCelsius <= 30) {
            tempImgTag = createNewImageElement("/assets/normal_temperature.svg", "normal-weather-temperature");
        }else {
            tempImgTag = createNewImageElement("/assets/temperature_high.svg", "hot-weather-temperature");
        }
        temperature.append(tempImgTag, document.createTextNode(`${tempCelsius}°C`));

        let humidityValue = (weather_data.main.humidity);
        const humidityImgTag = createNewImageElement("/assets/humidity_percentage.svg", "humidity-percent");
        humidity.append(humidityImgTag, document.createTextNode(`${humidityValue}%`), document.createElement("br"), document.createTextNode("Humidity"));

        let windSpeed = ((weather_data.wind.speed * 18) / 5).toFixed(2);
        const windImgTag = createNewImageElement("/assets/windy.svg", "windy");
        wind_speed.append(windImgTag, document.createTextNode(`${windSpeed} Km/Hr`), document.createElement("br"), document.createTextNode("Wind Speed"));

        let dayOrNightImgTag; 
        function getHoursAndMinutes(timestamp) {
            const now = new Date(timestamp);
            return {
                hours: now.getHours(),
                minutes: now.getMinutes(),
            };
        }
        
        let sunriseTime = getHoursAndMinutes(weather_data.sys.sunrise * 1000);
        let sunsetTime = getHoursAndMinutes(weather_data.sys.sunset * 1000);
        const currentTime = getHoursAndMinutes(Date.now());
        
        function isTimeBetween(current, start, end) {
            if (current.hours > start.hours || (current.hours === start.hours && current.minutes >= start.minutes)) {
                if (current.hours < end.hours || (current.hours === end.hours && current.minutes < end.minutes)) {
                    return true;
                }
            }
            return false;
        }

        let weatherDescription = weather_data.weather[0].description;
        
        if (isTimeBetween(currentTime, sunriseTime, sunsetTime)) {
            dayOrNightImgTag = createNewImageElement("/assets/day.svg", "day-time");
        } else {
            dayOrNightImgTag = createNewImageElement("/assets/night.svg", "night-time");
        }
        weather_description.append(dayOrNightImgTag, document.createTextNode(`${weatherDescription}`));

        loader.style.display = "none";
        weather_img.style.display = "none";
        weatherBody.classList.add("show");
        weatherBody.style.display = "block";

    } catch (error) {
        clearWeatherDetails();
        if(errorCase) errorCase.innerHTML = "";
        loader.style.display = "none";
        weatherBody.style.display = "block";
        const errorImg = createNewImageElement("/assets/404.svg", "error-image");
        const errorMessage = document.createElement("p");
        errorMessage.classList.add("error-message");
        errorMessage.textContent = error.message || "An unexpected error occurred. Please try again.";
        errorCase.append(errorImg, errorMessage);
        errorCase.style.display = "block";
    }
}


document.addEventListener('DOMContentLoaded', () => {
    updateTimeInfo(); 
    timeInterval = setInterval(updateTimeInfo, 60000);

    let searchClickCount = 0;
    let inputBoxClickCount = 0;

    searchBtn.addEventListener("click", () => {
        searchClickCount++;
        const city = inputBox.value.trim();

        if (city) {
            checkWeather(city);
            inputBox.value = "";
            inputBox.style.setProperty("--placeholder-color", "");
        } else {
            const placeholder = "Enter a valid city name";           
            inputBox.placeholder = placeholder;
            inputBox.style.setProperty("--placeholder-color", "red");
        }
    });

    inputBox.addEventListener("click", () => {
        if (searchClickCount === 10) {  
            inputBoxClickCount++;
            if (inputBoxClickCount === 1) {
                searchClickCount = 0;
                inputBoxClickCount = 0;
                location.reload(); 
            }
        }
    });

    document.addEventListener('visibilitychange', () => {
        if(document.hidden) {
            clearInterval(timeInterval);
        }else {
            updateTimeInfo();
            timeInterval = setInterval(updateTimeInfo, 60000);
        }
    });
    
    window.addEventListener('beforeunload', () => {
        clearInterval(timeInterval);
    });
});



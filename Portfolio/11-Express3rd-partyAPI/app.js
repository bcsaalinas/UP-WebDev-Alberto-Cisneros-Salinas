const express = require("express");
const https = require("https");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const apiKey = "fa4858b02328e5915944a58b52a6f336";

app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/", function (req, res) {
  const cityName = req.body.cityName;

  if (!cityName) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.write("<h1>City name is required.</h1>");
    res.write('<p><a href="/">Go back</a></p>');
    res.end();
    return;
  }

  const url =
    "https://api.openweathermap.org/data/2.5/weather?q=" +
    encodeURIComponent(cityName) +
    "&units=metric&appid=" +
    apiKey;

  https
    .get(url, function (apiResponse) {
      let data = "";

      apiResponse.on("data", function (chunk) {
        data += chunk;
      });

      apiResponse.on("end", function () {
        if (apiResponse.statusCode !== 200) {
          let errorMessage = "Unable to get weather details.";

          try {
            const errorJson = JSON.parse(data);
            if (errorJson && errorJson.message) {
              errorMessage = errorJson.message;
            }
          } catch (error) {
            // ignore parse errors
          }

          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.write("<h1>Oops!</h1>");
          res.write("<p>" + errorMessage + "</p>");
          res.write('<p><a href="/">Try another city</a></p>');
          res.end();
          return;
        }

        try {
          const weatherData = JSON.parse(data);
          const temp = weatherData.main && weatherData.main.temp;
          const weather = weatherData.weather && weatherData.weather[0];
          const description = weather ? weather.description : "No description";
          const icon = weather ? weather.icon : "";

          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.write("<h1>Weather for " + cityName + "</h1>");
          res.write("<p>Temperature: " + temp + " °C</p>");
          res.write("<p>Description: " + description + "</p>");

          if (icon) {
            res.write(
              '<img src="http://openweathermap.org/img/wn/' +
                icon +
                '@2x.png" alt="' +
                description +
                '">'
            );
          }

          res.write('<p><a href="/">Back to search</a></p>');
          res.end();
        } catch (error) {
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.write("<h1>Oops!</h1>");
          res.write("<p>Could not read the weather data.</p>");
          res.write('<p><a href="/">Try again</a></p>');
          res.end();
        }
      });
    })
    .on("error", function () {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.write("<h1>Oops!</h1>");
      res.write("<p>Could not reach the weather service.</p>");
      res.write('<p><a href="/">Try again</a></p>');
      res.end();
    });
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});

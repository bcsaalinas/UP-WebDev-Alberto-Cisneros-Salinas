const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/bmi", (req, res) => {
  const weight = parseFloat(req.body.weight);
  const height = parseFloat(req.body.height);

  if (!Number.isFinite(weight) || !Number.isFinite(height) || height <= 0) {
    return res
      .status(400)
      .send("Please provide valid weight (kg) and height (cm).");
  }

  const bmi = (weight / (height * height)) * 10000;
  res.send(`Your BMI is ${bmi.toFixed(2)}`); //just show 2 decimals
});

app.listen(3000, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

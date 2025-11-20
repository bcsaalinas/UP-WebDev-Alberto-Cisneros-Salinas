const express = require("express");
const app = express();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.engine("ejs", require("ejs").renderFile);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const mongoUrl = "mongodb://127.0.0.1:27017/f1";
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });

// Definition of a schema
const teamSchema = new mongoose.Schema({
  id: Number,
  name: String,
  nationality: String,
  url: String,
});
teamSchema.set("strictQuery", true);

const driverSchema = new mongoose.Schema({
  num: Number,
  code: String,
  forename: String,
  surname: String,
  dob: Date,
  nationality: String,
  url: String,
  team: teamSchema,
});
driverSchema.set("strictQuery", true);

const Team = mongoose.model("Team", teamSchema);
const Driver = mongoose.model("Driver", driverSchema);

const dataFile = path.join(__dirname, "public/data/f1_2023.csv");

const ensureDataLoaded = async (req, res, next) => {
  try {
    const hasDrivers = (await Driver.countDocuments()) > 0;
    if (!hasDrivers) {
      await seedDatabaseFromCsv();
    }
    next();
  } catch (err) {
    next(err);
  }
};

const parseCsvDate = (value) => {
  if (!value) {
    return undefined;
  }
  const parts = value.split("/");
  if (parts.length !== 3) {
    return undefined;
  }
  const [day, month, year] = parts;
  return new Date(`${year}-${month}-${day}`);
};

const normalizeTeamName = (value) => {
  const trimmed = (value || "").trim();
  if (!trimmed || trimmed.toLowerCase() === "n/a") {
    return "Free Agent";
  }
  return trimmed;
};

const toCleanNumber = (value) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const buildTeamSnapshot = (teamDoc) => {
  if (!teamDoc) {
    return undefined;
  }
  return {
    id: teamDoc.id,
    name: teamDoc.name,
    nationality: teamDoc.nationality,
    url: teamDoc.url,
    _id: teamDoc._id,
  };
};

const seedDatabaseFromCsv = async () => {
  const fileContent = await fs.promises.readFile(dataFile, "utf-8");
  const cleaned = fileContent.replace(/^\uFEFF/, "");
  const rows = cleaned.split(/\r?\n/).filter((line) => line.trim().length);
  if (rows.length <= 1) {
    return;
  }

  const driverRows = rows.slice(1).map((line) => line.split(","));
  const teamsEncountered = new Set();
  const drivers = [];

  driverRows.forEach((columns) => {
    if (columns.length < 8) {
      return;
    }
    const [num, code, forename, surname, dob, nationality, url, rawTeam] = columns;
    const teamName = normalizeTeamName(rawTeam);
    teamsEncountered.add(teamName);
    drivers.push({
      num: toCleanNumber(num),
      code: (code || "").trim(),
      forename: (forename || "").trim(),
      surname: (surname || "").trim(),
      dob: parseCsvDate(dob),
      nationality: (nationality || "").trim(),
      url: (url || "").trim(),
      teamName,
    });
  });

  if (!drivers.length) {
    return;
  }

  await Team.deleteMany({});
  const teamDocs = await Team.insertMany(
    Array.from(teamsEncountered).map((name, idx) => ({
      id: idx + 1,
      name,
      nationality: "",
      url: "",
    }))
  );

  const teamIndex = new Map(teamDocs.map((team) => [team.name, team]));

  await Driver.insertMany(
    drivers.map((driver) => ({
      num: driver.num,
      code: driver.code,
      forename: driver.forename,
      surname: driver.surname,
      dob: driver.dob,
      nationality: driver.nationality,
      url: driver.url,
      team: buildTeamSnapshot(teamIndex.get(driver.teamName)),
    }))
  );
};

app.get("/", ensureDataLoaded, async (req, res, next) => {
  try {
    const [drivers, teams] = await Promise.all([
      Driver.find().sort({ num: 1 }),
      Team.find().sort({ name: 1 }),
    ]);

    const nationalities = Array.from(
      new Set(drivers.map((driver) => driver.nationality).filter(Boolean))
    ).sort();

    const teamSummaries = teams.map((team) => {
      const relatedDrivers = drivers.filter(
        (driver) => driver.team && driver.team.name === team.name
      );
      return {
        _id: team._id,
        name: team.name,
        driverCount: relatedDrivers.length,
        drivers: relatedDrivers.map((driver) => `${driver.forename} ${driver.surname}`),
      };
    });

    res.render("index", {
      drivers,
      teams,
      nationalities,
      teamSummaries,
    });
  } catch (err) {
    next(err);
  }
});

app.post("/drivers", ensureDataLoaded, async (req, res, next) => {
  try {
    const {
      driverId,
      num,
      code,
      forename,
      surname,
      dob,
      nationality,
      url,
      teamId,
    } = req.body;

    const teamDoc = teamId ? await Team.findById(teamId) : null;
    const payload = {
      num: toCleanNumber(num),
      code: (code || "").trim(),
      forename: (forename || "").trim(),
      surname: (surname || "").trim(),
      dob: dob ? new Date(dob) : undefined,
      nationality: (nationality || "").trim(),
      url: (url || "").trim(),
      team: buildTeamSnapshot(teamDoc),
    };

    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined || payload[key] === null || payload[key] === "") {
        delete payload[key];
      }
    });

    if (driverId) {
      await Driver.findByIdAndUpdate(driverId, payload, { runValidators: true });
    } else {
      await Driver.create(payload);
    }

    res.redirect("/");
  } catch (err) {
    next(err);
  }
});

app.post("/drivers/:driverId/delete", ensureDataLoaded, async (req, res, next) => {
  try {
    const { driverId } = req.params;
    if (driverId) {
      await Driver.findByIdAndDelete(driverId);
    }
    res.redirect("/");
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Something went wrong. Please try again later.");
});

app.listen(3000, (err) => {
  console.log("Listening on port 3000");
});

const express = require("express");
const path = require("path");
const methodOverride = require("method-override");

const app = express();
const port = process.env.PORT || 3000;

const greetedNames = [];
let lastGreeted = null;
const tasks = [];

app.set("views", path.join(__dirname, "html"));
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));

function renderIndex(res, extra = {}) {
  res.render("index.html", {
    names: greetedNames,
    lastGreeted,
    tasks,
    ...extra,
  });
}

app.get("/", (req, res) => {
  renderIndex(res);
});

app.get("/greet", (req, res) => {
  const { name } = req.query;

  if (name && name.trim().length > 0) {
    const trimmed = name.trim();
    console.log(`Greeting received for: ${trimmed}`);
    greetedNames.push(trimmed);
    lastGreeted = trimmed;
  }

  res.redirect("/");
});

app.get("/greet/:index", (req, res, next) => {
  const index = Number.parseInt(req.params.index, 10);

  if (Number.isNaN(index) || index < 0 || index >= greetedNames.length) {
    const error = new Error("The selected person does not exist.");
    error.status = 404;
    return next(error);
  }

  const name = greetedNames[index];
  res.render("wazzup.html", { name });
});

app.put("/greet/:name", (req, res) => {
  const { name } = req.params;
  const trimmed = name.trim();

  if (trimmed.length > 0) {
    greetedNames.push(trimmed);
    lastGreeted = trimmed;
  }

  res.json({ names: greetedNames });
});

app.get("/task", (req, res) => {
  res.json({ tasks });
});

app.post("/task", (req, res) => {
  const { task } = req.body;

  if (task && task.trim().length > 0) {
    tasks.push(task.trim());
  }

  res.redirect("/");
});

app.delete("/task/:index", (req, res) => {
  const index = Number.parseInt(req.params.index, 10);

  if (!Number.isNaN(index) && index >= 0 && index < tasks.length) {
    tasks.splice(index, 1);
  }

  res.redirect("/");
});

app.post("/task/:index/move", (req, res) => {
  const index = Number.parseInt(req.params.index, 10);
  const { direction } = req.body;

  if (Number.isNaN(index) || index < 0 || index >= tasks.length) {
    return res.redirect("/");
  }

  const targetIndex =
    direction === "up" ? index - 1 : direction === "down" ? index + 1 : index;

  if (targetIndex >= 0 && targetIndex < tasks.length) {
    const [item] = tasks.splice(index, 1);
    tasks.splice(targetIndex, 0, item);
  }

  res.redirect("/");
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status);
  renderIndex(res, { error: err.message });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

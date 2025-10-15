const express = require("express");
const path = require("path");

const app = express();

const longContent =
  "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";

let posts = [
  {
    id: 1,
    title: "First Post",
    content: longContent,
  },
];
let nextPostId = 2;
let name = "";

app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "index.html"));
});

function handleLogin(req, res) {
  const incomingName =
    req.method === "POST" ? req.body.name : req.query.name;

  if (!incomingName || !incomingName.trim()) {
    return res.status(400).send("Please provide a name.");
  }

  name = incomingName.trim();
  const level = req.method === "POST" ? "secured" : "unsecured";
  res.send(`Hello ${name}! You used the ${level} path.`);
}

app.get("/login", handleLogin);
app.post("/login", handleLogin);

app.get("/test", (req, res) => {
  if (!name) {
    return res.redirect("/");
  }

  res.render("test", { name });
});

app.get("/home", (req, res) => {
  if (!name) {
    return res.redirect("/");
  }

  res.render("home", { name, posts });
});

app.post("/posts", (req, res) => {
  if (!name) {
    return res.redirect("/");
  }

  const title = req.body.title ? req.body.title.trim() : "";
  const content = req.body.content ? req.body.content.trim() : "";

  if (!title || !content) {
    return res.status(400).send("Title and content are required.");
  }

  posts.push({
    id: nextPostId,
    title,
    content,
  });
  nextPostId += 1;

  res.redirect("/home");
});

app.get("/posts/:id", (req, res) => {
  if (!name) {
    return res.redirect("/");
  }

  const id = Number(req.params.id);
  const post = posts.find((entry) => entry.id === id);

  if (!post) {
    return res.redirect("/home");
  }

  res.render("post", { name, post });
});

app.post("/posts/:id/update", (req, res) => {
  if (!name) {
    return res.redirect("/");
  }

  const id = Number(req.params.id);
  const post = posts.find((entry) => entry.id === id);

  if (!post) {
    return res.redirect("/home");
  }

  const title = req.body.title ? req.body.title.trim() : "";
  const content = req.body.content ? req.body.content.trim() : "";

  if (!title || !content) {
    return res.status(400).send("Title and content are required.");
  }

  post.title = title;
  post.content = content;

  res.redirect(`/posts/${id}`);
});

app.post("/posts/:id/delete", (req, res) => {
  if (!name) {
    return res.redirect("/");
  }

  const id = Number(req.params.id);
  posts = posts.filter((entry) => entry.id !== id);

  res.redirect("/home");
});

app.listen(3000, () => {
  console.log("Listening on port 3000");
});

const express = require("express");
const https = require("https");
const path = require("path");

const app = express();

const apiKey = process.env.MAILCHIMP_API_KEY || "YOUR_API_KEY";
const listId = process.env.MAILCHIMP_LIST_ID || "YOUR_LIST_ID";
const serverPrefix = process.env.MAILCHIMP_SERVER_PREFIX || "YOUR_SERVER_PREFIX";

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "signup.html"));
});

app.post("/", (req, res) => {
  const firstName = req.body.fName;
  const lastName = req.body.lName;
  const email = req.body.email;

  const missingCredentials =
    apiKey.startsWith("YOUR_") ||
    listId.startsWith("YOUR_") ||
    serverPrefix.startsWith("YOUR_");

  if (missingCredentials) {
    console.warn("Missing Mailchimp credentials. Update environment variables to enable signup.");
    return res.sendFile(path.join(__dirname, "failure.html"));
  }

  const data = {
    members: [
      {
        email_address: email,
        status: "subscribed",
        merge_fields: {
          FNAME: firstName,
          LNAME: lastName,
        },
      },
    ],
  };

  const jsonData = JSON.stringify(data);
  const url = `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${listId}`;
  const options = {
    method: "POST",
    auth: "anystring:" + apiKey,
  };

  const mailRequest = https.request(url, options, function(response) {
    let body = "";

    response.on("data", function(chunk) {
      body += chunk;
    });

    response.on("end", function() {
      let parsedResponse = null;
      try {
        parsedResponse = JSON.parse(body);
      } catch (err) {
        console.error("Unable to parse Mailchimp response", err);
      }

      const hasErrors = parsedResponse && parsedResponse.error_count > 0;
      if (response.statusCode === 200 && !hasErrors) {
        res.sendFile(path.join(__dirname, "success.html"));
      } else {
        res.sendFile(path.join(__dirname, "failure.html"));
      }
    });
  });

  mailRequest.on("error", function(err) {
    console.error("Mailchimp request failed", err);
    res.sendFile(path.join(__dirname, "failure.html"));
  });

  mailRequest.write(jsonData);
  mailRequest.end();
});

app.post("/failure", (req, res) => {
  res.redirect("/");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Listening on port " + port);
});

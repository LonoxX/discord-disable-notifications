const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
const PORT = 3000;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Define routes
app.get("/", (req, res) => {
  res.render("index", { messages: [] });
});

app.post("/execute", async (req, res) => {
  const startAt = Date.now();
  const messages = [];

  try {
    const token = req.body.token;
    const guilds = await getGuilds(token);

    for (const guild of guilds) {
      await makeRequest(
        "PATCH",
        `https://discordapp.com/api/v8/users/@me/guilds/${guild.id}/settings`,
        {
          message_notifications: 2,
        },
        token,
      );

      messages.push({
        type: "success",
        content: `Notifications disabled for '${guild.name}' (ID: ${guild.id}).`,
      });
    }

    const successMessage = `Done. Notifications updated for ${guilds.length} servers in ${(Date.now() - startAt) / 1000}s.`;
    res.render("index", { messages: [{ type: "success", content: successMessage }, ...messages] });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    res.render("index", { messages: [{ type: "error", content: error.message }] });
  }
});

const makeRequest = async (method, url, body, token) => {
  const fetchModule = await import("node-fetch");
  const fetch = fetchModule.default;

  const res = await fetch(url, {
    headers: {
      authorization: token,
      "content-type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    method,
  });
  const json = await res.json();
  return json;
};

const getGuilds = async (token) => {
  const res = await makeRequest("GET", "https://discordapp.com/api/v8/users/@me/guilds", null, token);
  return res;
};

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

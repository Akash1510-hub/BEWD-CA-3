const express = require("express");
const fs = require("fs");
const cors = require("cors");
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

const DATA_FILE = "data/events.json";
const API_KEY = "mysecureapikey";

if (!fs.existsSync("data")) fs.mkdirSync("data");
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]");

function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function authenticate(req, res, next) {
  const key = req.headers["x-api-key"];
  if (!key || key !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

app.post("/api/events", authenticate, (req, res) => {
  const { eventName, date, location, description, tags, userId } = req.body;
  if (!eventName || !date || !location || !userId) {
    return res.status(400).json({ error: "eventName, date, location, and userId are required" });
  }
  let events = readData();
  const duplicate = events.find(
    (e) => e.eventName === eventName && e.date === date && e.userId === userId
  );
  if (duplicate) {
    return res.status(400).json({ error: "Duplicate event for same user and date" });
  }
  const newEvent = {
    id: Date.now(),
    eventName,
    date,
    location,
    description: description || "",
    tags: tags || [],
    userId,
    createdAt: new Date().toISOString(),
  };
  events.push(newEvent);
  writeData(events);
  res.status(201).json({ message: "Event created", data: newEvent });
});

app.get("/api/events", (req, res) => {
  const { date, location, tag, sort, order } = req.query;
  let events = readData();
  if (date) events = events.filter((e) => e.date === date);
  if (location) events = events.filter((e) => e.location === location);
  if (tag) events = events.filter((e) => e.tags.includes(tag));
  if (sort === "date" || sort === "eventName") {
    events.sort((a, b) =>
      order === "desc" ? (a[sort] < b[sort] ? 1 : -1) : (a[sort] > b[sort] ? 1 : -1)
    );
  }
  res.json(events);
});

app.put("/api/events/:id", authenticate, (req, res) => {
  const { id } = req.params;
  const { location, description, tags, date, userId } = req.body;
  let events = readData();
  const event = events.find((e) => e.id == id);
  if (!event) return res.status(404).json({ error: "Event not found" });
  if (event.userId !== userId)
    return res.status(403).json({ error: "Unauthorized to update this event" });
  if (location) event.location = location;
  if (description) event.description = description;
  if (tags) event.tags = tags;
  if (date) event.date = date;
  writeData(events);
  res.json({ message: "Event updated", data: event });
});

app.delete("/api/events/:id", authenticate, (req, res) => {
  const { id } = req.params;
  const { userId, isAdmin } = req.body;
  let events = readData();
  const index = events.findIndex((e) => e.id == id);
  if (index === -1) return res.status(404).json({ error: "Event not found" });
  if (events[index].userId !== userId && !isAdmin)
    return res.status(403).json({ error: "Unauthorized to delete this event" });
  events.splice(index, 1);
  writeData(events);
  res.json({ message: "Event deleted successfully" });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

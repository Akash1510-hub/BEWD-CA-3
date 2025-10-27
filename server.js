const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json());

let events = [];

app.post("/api/events", (req, res) => {
  const { eventName, organizer, reviewText, rating, tags } = req.body;

  if (!eventName || !organizer || !reviewText || rating === undefined) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }

  const duplicate = events.find((e) => e.eventName === eventName);
  if (duplicate) {
    return res.status(400).json({ error: "Event already reviewed" });
  }

  const newEvent = {
    id: Date.now(),
    eventName,
    organizer,
    reviewText,
    rating,
    tags: tags || [],
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  events.push(newEvent);
  res.status(201).json({ message: "Review added!", data: newEvent });
});

app.get("/api/events", (req, res) => {
  res.json(events);
});

app.put("/api/events/:id", (req, res) => {
  const { id } = req.params;
  const { reviewText, rating, tags } = req.body;

  const event = events.find((e) => e.id == id);
  if (!event) return res.status(404).json({ error: "Event not found" });

  if (rating && (rating < 1 || rating > 5)) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }

  if (reviewText) event.reviewText = reviewText;
  if (rating) event.rating = rating;
  if (tags) event.tags = tags;

  res.json({ message: "Review updated!", data: event });
});

app.delete("/api/events/:id", (req, res) => {
  const { id } = req.params;

  const index = events.findIndex((e) => e.id == id);
  if (index === -1) return res.status(404).json({ error: "Event not found" });

  events.splice(index, 1);
  res.json({ message: "Review deleted successfully" });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
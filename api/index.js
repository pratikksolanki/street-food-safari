import app from "./app.js";

const PORT = process.env.PORT || 3333;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Street Food Safari API running on http://localhost:${PORT}`);
});

const express = require("express");
const path = require("path");

const app = express();
const port = process.env.PORT || 3200;

app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (_req, res) => {
    res.json({ ok: true });
});

app.listen(port, () => {
    console.log(`Class status web running at http://localhost:${port}`);
});

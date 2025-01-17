import express from "express";
import dotenv from "dotenv";

import { outlierDetection } from "./services/outlierDetection";
import { parseCsv } from "./services/parseCsv";
import db from "./services/db";
import { upload } from "./services/config";
import {insert} from "./services/repository";

dotenv.config({ path: `.env.${process.env.NODE_ENV ?? "dev"}` });

const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOST || "localhost";

async function main() {
  await db.connect();

  app.get("/", async (req, res) => {
    res.send("Express + TypeScript Server endpoint");
  });

  app.post("/upload", upload.single('csvFile'), async (req, res) => {
    const file = req.file;
    if (!file) {
      return res.status(400).send("No file uploaded");
    }

    try {
      const parsedFile = await parseCsv(file.path);
      if (outlierDetection(parsedFile)) {
        return res.status(422).send("Unprocessable entity - outliers");
      }
      await insert(parsedFile)

      res.send("Data is now being stored: " + JSON.stringify(parsedFile));
    } catch (err) {
      console.error(err);
      res.status(422).send("Unprocessable entity");
    }
  });

  app.listen(port, () => {
    console.log(`Server is running at http://${host}:${port}`);
  });
}

main();

"use strict";

const path = require("path");
const model = require(path.join(__dirname, "..", "source", "model_engine.js"));

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});
process.stdin.on("end", () => {
  const cases = JSON.parse(input);
  const results = cases.map((values) => ({
    clinical_probability: model.clinicalProbability(values),
    mmef_probability: model.mmefProbability(values),
    clinical_linear_predictor: model.clinicalLinearPredictor(values),
    mmef_linear_predictor: model.mmefLinearPredictor(values),
  }));
  process.stdout.write(JSON.stringify(results));
});

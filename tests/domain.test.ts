import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildPlan,
  category,
  commuteSavings,
  defaultProfile,
  cities,
  localReply,
  profileSchema,
  urgentMessage,
} from "../shared/domain.ts";

test("US AQI categories handle all boundaries and unavailable readings", () => {
  const cases: [number, number][] = [
    [0, 0],
    [50, 0],
    [51, 1],
    [100, 1],
    [101, 2],
    [150, 2],
    [151, 3],
    [200, 3],
    [201, 4],
    [300, 4],
    [301, 5],
    [501, 5],
    [-1, -1],
    [NaN, -1],
  ];
  for (const [aqi, level] of cases)
    assert.equal(category(aqi).level, level, `AQI ${aqi}`);
});
test("sensitive households get indoor alternatives earlier", () => {
  assert.match(buildPlan(defaultProfile, 125)[0].title, /indoors/);
  assert.match(
    buildPlan({ ...defaultProfile, children: false }, 125)[0].title,
    /outdoor/,
  );
  assert.match(
    buildPlan({ ...defaultProfile, children: false, sensitive: true }, 125)[0]
      .title,
    /indoors/,
  );
});
test("severe smog does not trade exposure for active transport", () => {
  const plan = buildPlan(defaultProfile, 312);
  assert.match(plan[0].title, /indoors/);
  assert.match(plan[1].title, /essential/);
  assert.doesNotMatch(plan[1].description, /walk|cycl/i);
});
test("home guidance respects equipment and budget", () => {
  assert.match(
    buildPlan(defaultProfile, 300)[2].description,
    /no new equipment/,
  );
  assert.match(
    buildPlan({ ...defaultProfile, purifier: true }, 300)[2].description,
    /filter/,
  );
  assert.match(
    buildPlan({ ...defaultProfile, budget: "flexible" }, 300)[2].description,
    /HEPA/,
  );
});
test("carbon estimates are bounded and only assigned to car substitution", () => {
  assert.equal(commuteSavings(12), 1.56);
  assert.equal(commuteSavings(0), 0);
  assert.equal(commuteSavings(-12), 0);
  assert.equal(
    buildPlan({ ...defaultProfile, commute: "transit" }, 80)[1].co2,
    0,
  );
  assert.equal(buildPlan({ ...defaultProfile, commute: "home" }, 80)[1].co2, 0);
});
test("acute symptoms trigger immediate guidance regardless of city", () => {
  for (const message of [
    "I can't breathe",
    "My child has blue lips",
    "I have chest pain",
    "Severe breathlessness",
    "difficulty breathing",
  ])
    assert.match(urgentMessage(message)!, /emergency/);
  assert.equal(urgentMessage("Can I open a window?"), null);
  assert.match(
    localReply("I cannot breathe", defaultProfile, 25, cities[3]),
    /emergency/,
  );
});
test("local guidance never treats plants as filtration or blocks ventilation", () => {
  assert.match(
    localReply("Will plants purify my home?", defaultProfile, 200, cities[0]),
    /not a substitute/,
  );
  assert.match(
    localReply("Can I open windows?", defaultProfile, 200, cities[0]),
    /do not block required ventilation/,
  );
});
test("profile schema rejects invalid input", () => {
  assert.equal(
    profileSchema.safeParse({ ...defaultProfile, distance: 201 }).success,
    false,
  );
  assert.equal(
    profileSchema.safeParse({ ...defaultProfile, name: "  " }).success,
    false,
  );
  assert.equal(
    profileSchema.safeParse({ ...defaultProfile, commute: "plane" }).success,
    false,
  );
});

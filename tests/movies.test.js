const supertest = require("supertest");
const app = require("../app");
const api = supertest(app);
const Watchlist = require("../models/Watchlist");
const mongoose = require("mongoose");

let token = "";

beforeAll(async () => {
  await api.post("/users/register").send({
    username: "nisch",
    email: "nisch@gmail.com",
    password: "nischal123",
    confirmPassword: "nischal123",
  });

  const res = await api.post("/users/login").send({
    username: "nisch",
    password: "nischal123",
  });

  token = res.body.token;
});

test("user can get toprated movies", async () => {
  await api
    .get("/movies/top_rated")
    .set("authorization", `Bearer ${token}`)
    .expect(200)
    .expect("Content-Type", /application\/json/)
    .then((res) => {
      expect(res.body.results.length).toBeGreaterThan(0);
    });
});

test("user can get popular movies", async () => {
  await api
    .get("/movies/popular")
    .set("authorization", `Bearer ${token}`)
    .expect(200)
    .expect("Content-Type", /application\/json/)
    .then((res) => {
      expect(res.body.results.length).toBeGreaterThan(0);
    });
});

test("user can get trending movies", async () => {
  await api
    .get("/movies/trending")
    .set("authorization", `Bearer ${token}`)
    .expect(200)
    .expect("Content-Type", /application\/json/)
    .then((res) => {
      expect(res.body.results.length).toBeGreaterThan(0);
    });
});

test("user can get movie details", async () => {
  // Assuming movieID is 12345, you can replace it with an actual movie ID for testing
  const movieID = "123";

  await api
    .get(`/movies/${movieID}`)
    .set("authorization", `Bearer ${token}`)
    .expect(200)
    .expect("Content-Type", /application\/json/)
    .then((res) => {
      const movieDetails = res.body;
    });
});

test("user can search movie", async () => {
  await api
    .get("/movies/search/avengers")
    .set("authorization", `Bearer ${token}`)
    .expect(200)
    .expect("Content-Type", /application\/json/)
    .then((res) => {
      expect(res.body.results.length).toBeGreaterThan(0);
    });
});

afterAll(async () => await mongoose.connection.close());

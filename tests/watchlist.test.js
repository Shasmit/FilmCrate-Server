const supertest = require("supertest");
const app = require("../app");
const api = supertest(app);
const Watchlist = require("../models/Watchlist");
const mongoose = require("mongoose");

let token = "";

beforeAll(async () => {
  await Watchlist.deleteMany();
  await Watchlist.create({
    user: new mongoose.Types.ObjectId(),
    movieId: "123",
    movieDetails: {
      id: "123",
      title: "The Lord of the Rings",
      poster_path: "/cezWGskPY5x7GaglTTRN4Fugfb8.jpg",
    },
  });

  await api.post("/users/register").send({
    username: "aaryan",
    email: "aaryan@gmail.com",
    password: "aaryan123",
    confirmPassword: "aaryan123",
  });

  const res = await api.post("/users/login").send({
    username: "aaryan",
    password: "aaryan123",
  });

    token = res.body.token;

});

test("unauthorized user cannot get list of movies in watchlist", async () => {
    await api
    
        .get("/watchlist")
        .expect(401)
        .expect("Content-Type", /application\/json/)
        .then((res) => {
        expect(res.body.error).toMatch(/token/i);
        });
})

test("user can add a movie to watchlist", async () => {
    await api
        .post("/watchlist/123")
        .set("authorization", `Bearer ${token}`)
        .expect(200)
        .expect("Content-Type", /application\/json/)
        .then((res) => {
        expect(res.body.data[0].movieId).toBe("123");
        expect(res.body.data[0].movieDetails.title).toBe("The Lord of the Rings");
        });
})

test("user can get list of movies in watchlist", async () => {
    await api
        .get("/watchlist")
        .set("authorization", `Bearer ${token}`)
        .expect(200)
        .expect("Content-Type", /application\/json/)
        .then((res) => {
        expect(res.body.data[0].movieId).toBe("123");
        expect(res.body.data[0].movieDetails.title).toBe("The Lord of the Rings");
        });
})

test("user can remove a movie from watchlist", async () => {
    await api
        .delete("/watchlist/123")
        .set("authorization", `Bearer ${token}`)
        .expect(200)
        .then((res) => {
        expect(res.status).toBe(200);
        });
})



afterAll(async () => await mongoose.connection.close());
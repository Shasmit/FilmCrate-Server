const supertest = require("supertest");
const app = require("../app");
const api = supertest(app);
const Review = require("../models/Review");
const mongoose = require("mongoose");

let token = "";

beforeAll(async () => {
  await Review.deleteMany();
  await Review.create({
    movieID: "123",
    user: new mongoose.Types.ObjectId(),
    rating: 5,
    review: "very good movie",
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

test("unauthorized user cannot get list of reviews", async () => {
  await api

    .get("/movies/123/reviews")
    .expect(401)
    .expect("Content-Type", /application\/json/)
    .then((res) => {
      expect(res.body.error).toMatch(/token/i);
    });
});

test("user can add a review", async () => {
  await api

    .post("/movies/123/reviews")
    .set("authorization", `Bearer ${token}`)
    .send({
      rating: 4,
      review: "good movie",
    })
    .expect(201)
    .expect("Content-Type", /application\/json/)
    .then((res) => {
      expect(res.body.message).toMatch(/added/);
      expect(res.body.review.review).toBe("good movie");
    });
});

test("user can update a review", async () => {
  const review = await Review.findOne({ review: "good movie" });
  await api

    .put(`/movies/123/reviews/${review._id}`)
    .set("authorization", `Bearer ${token}`)
    .send({
      rating: 3,
      review: "average movie",
    })
    .expect(201)
    .expect("Content-Type", /application\/json/)
    .then((res) => {
      expect(res.body.message).toMatch(/updated/);
      expect(res.body.review.review).toBe("average movie");
    });
});

test("user can delete a review", async () => {
  const review = await Review.findOne({ review: "average movie" });

  await api

    .delete(`/movies/123/reviews/${review._id}`)
    .set("authorization", `Bearer ${token}`)
    .expect(204);
});

test("unauthorized user cannot add a review", async () => {
  await api
    .post("/movies/123/reviews")
    .send({
      rating: 4,
      review: "good movie",
    })
    .expect(401)
    .expect("Content-Type", /application\/json/)
    .then((res) => {
      expect(res.body.error).toMatch(/token/i);
    });
});

test("user can update a non-existing review", async () => {
  const nonExistingReviewID = new mongoose.Types.ObjectId();

  await api
    .put(`/movies/123/reviews/${nonExistingReviewID}`)
    .set("authorization", `Bearer ${token}`)
    .send({
      rating: 3,
      review: "average movie",
    })
    .expect(404)
    .expect("Content-Type", /application\/json/)
    .then((res) => {
      expect(res.body.error).toMatch(/not found/i);
    });
});

test("user can delete a non-existing review", async () => {
  const nonExistingReviewID = new mongoose.Types.ObjectId();

  await api
    .delete(`/movies/123/reviews/${nonExistingReviewID}`)
    .set("authorization", `Bearer ${token}`)
    .expect(404)
    .expect("Content-Type", /application\/json/)
    .then((res) => {
      expect(res.body.error).toMatch(/not found/i);
    });
});

test("user can like a review", async () => {
  const review = await Review.findOne({ review: "very good movie" });

  await api
    .post(`/movies/123/reviews/${review._id}/like`)
    .set("authorization", `Bearer ${token}`)
    .expect(200)
    .expect("Content-Type", /application\/json/)
    .then((res) => {
      expect(res.body.message).toMatch(/liked/);
    });
});

test("user can unlike a review", async () => {
  const review = await Review.findOne({ review: "very good movie" });

  await api
    .post(`/movies/123/reviews/${review._id}/unlike`)
    .set("authorization", `Bearer ${token}`)
    .expect(200)
    .expect("Content-Type", /application\/json/)
    .then((res) => {
      expect(res.body.message).toMatch(/unliked/);
    });
});

test("user can fetch a specific review", async () => {
  const review = await Review.findOne({ review: "very good movie" });

  await api
    .get(`/movies/123/reviews/${review._id}`)
    .set("authorization", `Bearer ${token}`)
    .expect(200)
    .expect("Content-Type", /application\/json/)
    .then((res) => {
      expect(res.body.data._id).toBe(review._id.toString());
      expect(res.body.data.rating).toBe(review.rating);
      expect(res.body.data.review).toBe(review.review);
    });
});

test("handle invalid rating data", async () => {
  await api
    .post("/movies/123/reviews")
    .set("authorization", `Bearer ${token}`)
    .send({
      // Missing 'rating' field
      rating: 4,
    })
    .expect(200)
});

test("handle invalid reviewID format", async () => {
  await api
    .get(`/movies/123/reviews/invalidReviewID`)
    .set("authorization", `Bearer ${token}`)
    .expect(500)
    .expect("Content-Type", /application\/json/)
    .then((res) => {
      expect(res.body.error).toMatch(/invalid.*reviewID/i);
    });
});

afterAll(async () => await mongoose.connection.close());

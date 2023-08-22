const supertest = require("supertest");
const app = require("../app");
const { default: mongoose } = require("mongoose");
const api = supertest(app);
const User = require("../models/User");

beforeAll(async () => {
  await User.deleteMany({});
});

test("user registration", async () => {
  const res = await api
    .post("/users/register")
    .send({
      username: "aaryansi",
      email: "aaryansi@gmail.com",
      password: "aaryansi123",
      confirmPassword: "aaryansi123",
    })
    .expect(201);

  expect(res.body.username).toBe("aaryansi");
});

test("registration of duplicate username", () => {
  return api
    .post("/users/register")
    .send({
      username: "aaryansi",
      email: "aaryansi@gmail.com",
      password: "aaryansi123",
      confirmPassword: "aaryansi123",
    })
    .expect(400)
    .then((res) => {
      expect(res.body.error).toMatch(/Duplicate/);
    });
});

test("registered users can login", async () => {
  const res = await api
    .post("/users/login")
    .send({
      username: "aaryansi",
      password: "aaryansi123",
    })
    .expect(200);

  expect(res.body.token).toBeDefined();
});

test("user login with unregistered username", async () => {
  const res = await api
    .post("/users/login")
    .send({
      username: "aaryani",
      password: "aaryani123",
    })
    .expect(400)
    .then((res) => {
      expect(res.body.error).toBe("User not found");
    });
});

test("user login with wrong password", async () => {
  const res = await api
    .post("/users/login")
    .send({
      username: "aaryansi",
      password: "aaryani123adcs",
    })
    .expect(400)
    .then((res) => {
      expect(res.body.error).toBe("Invalid password");
    });
});

test("update user profile", async () => {
  const loginResponse = await api.post("/users/login").send({
    username: "aaryansi",
    password: "aaryansi123",
  });

  const token = loginResponse.body.token;

  const res = await api
    .put("/users/edit-profile")
    .set("Authorization", `Bearer ${token}`)
    .send({
      username: "aaryansi123",
      email: "aaryansi123@gmail.com",
    })
    .expect(200);

  expect(res.body.username).toBe("aaryansi123");
  expect(res.body.email).toBe("aaryansi123@gmail.com");

});


test("update user password", async () => {
  const loginResponse = await api.post("/users/login").send({
    username: "aaryansi123",
    password: "aaryansi123",
  });

  const token = loginResponse.body.token;

  const res2 = await api
    .put("/users/change-password")
    .set("Authorization", `Bearer ${token}`)
    .send({
      currentPassword: "aaryansi123",
      newPassword: "aaryansi12345",
      confirmPassword: "aaryansi12345",
    })
    .expect(204);

  
});


test("upload user image", async () => {
  const loginResponse = await api.post("/users/login").send({
    username: "aaryansi123",
    password: "aaryansi12345",
  });

  const token = loginResponse.body.token;

  // Make a POST request to uploadImage endpoint with the valid token and a dummy image
  const res = await api
    .post("/users/uploadImage")
    .set("Authorization", `Bearer ${token}`)
    .attach("profilePicture", "public/uploads/IMG-1689759901517.jpg") // Replace "path_to_dummy_image/dummy.jpg" with the actual path to a dummy image

    .expect(200);

  expect(res.body.success).toBe(true);
  expect(res.body.data).toBeDefined();
});


test("get user profile", async () => {
  const loginResponse = await api.post("/users/login").send({
    username: "aaryansi123",
    password: "aaryansi12345",
  });

  const token = loginResponse.body.token;

  const res = await api
    .get("/users/")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  // Ensure that the response contains the user data with isUserLoggedIn field
  expect(res.body.user.length).toBe(1);
  expect(res.body.user[0].username).toBe("aaryansi123");
  expect(res.body.user[0].isUserLoggedIn).toBe(true); // Since we are using the same user's token, isUserLoggedIn should be true
});


afterAll(async () => await mongoose.connection.close());
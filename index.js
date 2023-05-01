const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const express = require("express");
const app = express();
const DB = require("./database.js");
// const { WebSocketServer } = require('ws');
const { PeerProxy } = require("./peerProxy.js");

const authCookieName = "token";

// The service port. In production the application is statically hosted by the service on the same port.
const port = process.argv.length > 2 ? process.argv[2] : 4000;

// JSON body parsing using built-in middleware
app.use(express.json());

// Use the cookie parser middleware for tracking authentication tokens
app.use(cookieParser());

// Serve up the application's static content
app.use(express.static("public"));

// Router for service endpoints
var apiRouter = express.Router();
app.use(`/api`, apiRouter);

apiRouter.post("/auth/create", async (req, res) => {
  if (await DB.getUser(req.body.email)) {
    res.status(409).send({ msg: "Existing user" });
  } else {
    const user = await DB.createUser(req.body.email, req.body.password);

    // Set the cookie
    setAuthCookie(res, user.token);

    res.send({
      id: user._id,
    });
  }
});

apiRouter.post("/auth/login", async (req, res) => {
  const user = await DB.getUser(req.body.email);
  if (user) {
    if (await bcrypt.compare(req.body.password, user.password)) {
      setAuthCookie(res, user.token);
      res.send({ id: user._id });
      return;
    }
  }
  res.status(401).send({ msg: "Unauthorized" });
});

apiRouter.delete("/auth/logout", (_req, res) => {
  res.clearCookie(authCookieName);
  res.status(204).end();
});

// apiRouter.get('/task', async (_req, res) => {
//     const allTasks = await DB.getTasks(_req.body.email);
//     res.send(allTasks);
// });
apiRouter.put("/task", async (_req, res) => {
  const allTasks = await DB.getTasks(_req.body.email);
  res.send(allTasks);
});
// GetUser returns information about a user
apiRouter.get("/user/:email", async (req, res) => {
  const user = await DB.getUser(req.params.email);
  if (user) {
    const token = req?.cookies.token;
    res.send({ email: user.email, authenticated: token === user.token });
    return;
  }
  res.status(404).send({ msg: "Unknown" });
});

// secureApiRouter verifies credentials for endpoints
var secureApiRouter = express.Router();
apiRouter.use(secureApiRouter);

secureApiRouter.use(async (req, res, next) => {
  authToken = req.cookies[authCookieName];
  const user = await DB.getUserByToken(authToken);
  if (user) {
    next();
  } else {
    res.status(401).send({ msg: "Unauthorized" });
  }
});

secureApiRouter.get("/task/:email", async (_req, res) => {
  const allTasks = await DB.getTasks(_req.params.email);
  res.send(allTasks);
});

secureApiRouter.post("/task/get/:user", async (req, res) => {
  DB.addTask(req.body);
  const TasksSending = await DB.getTasks(req.params.user);
  res.send(TasksSending);
  // const scores = await DB.getTable();
  // res.send(scores);
});

secureApiRouter.post("/task/:ID", async (req, res) => {
  const returnVal = await DB.toggleTask(req.params.ID);
  res.send(returnVal);
  // const scores = await DB.getTable();
  // res.send(scores);
});

secureApiRouter.delete("/task/:ID", async (req, res) => {
  DB.deleteTask(req.params.ID);
  res.status(200).send({ type: "All is well" });
});

// Default error handler
app.use(function (err, req, res, next) {
  res.status(500).send({ type: err.name, message: err.message });
});

app.use((_req, res) => {
  res.sendFile("list.html", { root: "public" });
});

// setAuthCookie in the HTTP response
function setAuthCookie(res, authToken) {
  res.cookie(authCookieName, authToken, {
    secure: true,
    httpOnly: true,
    sameSite: "strict",
  });
}

const server = app.listen(port, () => {});

new PeerProxy(server);

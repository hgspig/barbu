const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const uuid = require("uuid");

const userName = process.env.MONGOUSER;
const password = process.env.MONGOPASSWORD;
const hostname = process.env.MONGOHOSTNAME;

if (!userName) {
  throw Error("Database not configured. Set environment variables");
}

const url = `mongodb+srv://${userName}:${password}@${hostname}`;

const client = new MongoClient(url);
//this is what adds a new collection to the database
const taskCollection = client.db("startup").collection("tasks");
const userCollection = client.db("startup").collection("user");

function addTask(task) {
  return taskCollection.insertOne(task);
}
async function toggleTask(ID) {
  let currTask = await taskCollection.findOne({ _id: new ObjectId(ID) });
  // currTask.completed = !currTask.completed;
  // let currTask = taskCollection.find(new ObjectId(ID));
  if (currTask != null) {
    let collecSuccess = await taskCollection.updateOne(
      { _id: new ObjectId(ID) },
      { $set: { completed: !currTask.completed } }
    );
    return currTask;
  }
}
function getTasks(currentUser) {
  const cursor = taskCollection.find(
    { user: currentUser },
    { completed: 1, Category: 1 }
  );
  return cursor.toArray();
}
function deleteTask(ID) {
  try {
    taskCollection.deleteOne({ _id: new ObjectId(ID) });
  } catch (e) {}
}

function getUser(email) {
  return userCollection.findOne({ email: email });
}

function getUserByToken(token) {
  return userCollection.findOne({ token: token });
}

async function createUser(email, password) {
  // Hash the password before we insert it into the database
  const passwordHash = await bcrypt.hash(password, 10);

  const user = {
    email: email,
    password: passwordHash,
    token: uuid.v4(),
  };
  await userCollection.insertOne(user);

  return user;
}

module.exports = {
  getUser,
  getUserByToken,
  createUser,
  addTask,
  toggleTask,
  getTasks,
  deleteTask,
};

// async function toggleTask(ID) {
//   currTask = await taskCollection.findOne({ _id: new ObjectId(ID) });
//   // currTask.completed = !currTask.completed;
//   let currTask = taskCollection.find(new ObjectId(ID));
//   taskCollection.updateOne(
//     { _id: new ObjectId(ID) },
//     { $set: { completed: !currTask.completed } }
//   );
//   return currTask;

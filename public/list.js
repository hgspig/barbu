const MakeTaskEvent = "taskMade";
const CompleteTaskEvent = "taskCompleted";

let socket;
let enterButton = document.getElementById("enter");
let input = document.getElementById("userInput");
let taskList = {};
let taskListNum = 0;
let currentUser = localStorage.getItem("userName");

async function origionalListLoad() {
  await configureWebSocket();
  const response = await fetch("/api/task/" + currentUser);
  let tasks = await response.json();
  for (i in tasks) {
    let task = tasks[i];
    taskList[taskListNum] = task._id;
    let curElement;
    if (task.category == "school") {
      curElement = createListElement(
        task.title,
        "schoolMasterList",
        task._id,
        true,
        task.category
      );
    } else if (task.category == "work") {
      curElement = createListElement(
        task.title,
        "workMasterList",
        task._id,
        true,
        task.category
      );
    } else if (task.category == "other") {
      curElement = createListElement(
        task.title,
        "otherMasterList",
        task._id,
        true,
        task.category
      );
    }
    taskListNum = taskListNum + 1;
    if (task.completed == true) {
      curElement.classList.toggle("done");
    }
  }
}

function createListElement(newTaskText, idToUse, ID, onLoad, category) {
  let li = document.createElement("li"); // creates an element "li"
  li.classList.add("list-group-item");
  li.appendChild(document.createTextNode(newTaskText)); //makes text from input field the li text
  let ul = document.getElementById(idToUse);
  ul.appendChild(li); //adds li to ul
  ul.value = ""; //Reset text input field
  if (!onLoad) {
    broadcastEvent(currentUser, MakeTaskEvent, { type: category });
  }
  //START STRIKETHROUGH
  async function crossOut() {
    if (!deleted) {
      const completed = li.classList.toggle("done");
      const response = await fetch("/api/task/" + ID, {
        method: "POST",
        headers: { "content-type": "application/json" },
      });
      if (completed) {
        const responseBody = await response.json();
        broadcastEvent(currentUser, CompleteTaskEvent, { type: category });
      }
    }
  }
  li.addEventListener("click", crossOut);
  //END STRIKETHROUGH

  // START DELETE BUTTON
  let deleted = false;
  var dBtn = document.createElement("button");
  dBtn.appendChild(document.createTextNode("X"));
  dBtn.classList = "deleteButton";
  li.appendChild(dBtn);
  dBtn.addEventListener("click", deleteListItem);
  // END DELETE BUTTON

  //ADD CLASS DELETE (DISPLAY: NONE)
  async function deleteListItem() {
    deleted = true;
    const response = await fetch("/api/task/" + ID, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
    });

    li.classList = "delete";
    li.remove();
  }
  //END ADD CLASS DELETE
  return li;
}

async function addSchoolTask(event) {
  event.preventDefault();
  const newTask = document.querySelector("#SchoolTask");
  const newTaskFull = {
    title: newTask.value,
    completed: false,
    category: "school",
    user: currentUser,
  };
  const response = await fetch("/api/task/get/" + currentUser, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(newTaskFull),
  });
  let tasks = await response.json();
  createListElement(
    newTask.value,
    "schoolMasterList",
    tasks[tasks.length - 1]._id,
    false,
    "school"
  );
  newTask.value = "";
  taskList[taskListNum] = tasks[tasks.length - 1]._id; //how do I get the id from the response?
}
const schoolTaskAdder = document.getElementById("newSchoolTask");
schoolTaskAdder.addEventListener("submit", addSchoolTask);

//work

async function addWorkTask(event) {
  event.preventDefault();
  const newTask = document.querySelector("#WorkTask");
  const newTaskFull = {
    title: newTask.value,
    completed: false,
    category: "work",
    user: currentUser,
  };
  const response = await fetch("/api/task/get/" + currentUser, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(newTaskFull),
  });
  let tasks = await response.json();
  createListElement(
    newTask.value,
    "workMasterList",
    tasks[tasks.length - 1]._id,
    false,
    "work"
  );
  newTask.value = "";
  taskList[taskListNum] = tasks[tasks.length - 1]._id; //how do I get the id from the response?
}
const workTaskAdder = document.getElementById("newWorkTask");
workTaskAdder.addEventListener("submit", addWorkTask);

//other
async function addOtherTask(event) {
  event.preventDefault();
  const newTask = document.querySelector("#OtherTask");
  const newTaskFull = {
    title: newTask.value,
    completed: false,
    category: "other",
    user: currentUser,
  };
  const response = await fetch("/api/task/get/" + currentUser, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(newTaskFull),
  });
  let tasks = await response.json();
  createListElement(
    newTask.value,
    "otherMasterList",
    tasks[tasks.length - 1]._id,
    false,
    "other"
  );
  newTask.value = "";
  taskList[taskListNum] = tasks[tasks.length - 1]._id; //how do I get the id from the response?
}
const otherTaskAdder = document.getElementById("newOtherTask");
otherTaskAdder.addEventListener("submit", addOtherTask);

// Functionality for peer communication using WebSocket

async function configureWebSocket() {
  const protocol = window.location.protocol === "http:" ? "ws" : "wss";
  socket = new WebSocket(`${protocol}://${window.location.host}/ws`);
  socket.onopen = (event) => {
    displayConnection("system", "globally", "connected");
  };
  socket.onclose = (event) => {
    displayConnection("system", "globally", "disconnected");
  };
  socket.onmessage = async (event) => {
    const msg = JSON.parse(await event.data.text());
    if (msg.type === CompleteTaskEvent) {
      displayMsg(msg.from, `just completed a `, msg.value, ` goal.`, msg.from);
    } else if (msg.type === MakeTaskEvent) {
      displayMsg(msg.from, `just made a new `, msg.value, ` goal.`, msg.from);
    }
  };
}

function displayMsg(cls, msg1, value, msg2, user) {
  const chatText = document.querySelector("#user-messages");
  chatText.innerHTML =
    `<div class="event"><span class="${cls}-event">${user}</span> ${msg1}${value}${msg2}</div>` +
    chatText.innerHTML;
}

function displayConnection(cls, from, msg) {
  const chatText = document.querySelector("#user-messages");
  chatText.innerHTML =
    `<div class="event"><span class="${cls}-event">${msg}</span> ${from}</div>` +
    chatText.innerHTML;
}

function broadcastEvent(from, type, value) {
  const event = {
    from: from,
    type: type,
    value: value.type,
  };
  socket.send(JSON.stringify(event));
}

// configureWebSocket();
origionalListLoad();

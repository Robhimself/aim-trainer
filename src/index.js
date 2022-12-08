//
import { initializeApp } from "firebase/app";
import { collection, onSnapshot, getFirestore, query, where, addDoc, getDoc } from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
  apiKey: "AIzaSyAjGJysYIm-TLaM8WccauZC8sI86PKmIKA",
  authDomain: "aim-trainer-20092.firebaseapp.com",
  databaseURL: "https://aim-trainer-20092-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "aim-trainer-20092",
  storageBucket: "aim-trainer-20092.appspot.com",
  messagingSenderId: "399277069",
  appId: "1:399277069:web:7f419230780e184a4ce944",
  measurementId: "G-Q8C79YF5G4",
};

// Initialize Firebase
initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

const colRef = collection(db, "scores");
const userRef = collection(db, "users");

// Model
const game = {
  app: {
    view: "",
    user: null,
    username: "",
    points: null,
  },

  input: {
    name: "",
    username: "",
    login: {},
    reactionTime: [],
    roundTime: [],
    startTime: 0,
    finishTime: 0,
  },

  data: {
    users: [],
    scores: [],
  },
};

// get real time collection data

const q = query(colRef);
onSnapshot(q, (snapshot) => {
  let getScores = [];
  snapshot.docs.forEach((doc) => {
    getScores.push({ ...doc.data() });
  });
  game.data.scores = getScores;
});

const uq = query(userRef);
onSnapshot(uq, (snapshot) => {
  let getUsers = [];
  snapshot.docs.forEach((user) => {
    getUsers.push({ ...user.data() });
  });
  game.data.users = getUsers;
  onAuthStateChanged(auth, (user) => {
    if (user) {
      game.app.view = "game";
      game.app.username = user.displayName;
      let currentId = getUsers.filter((person) => person.username === game.app.username);
      game.app.user = currentId[0].id;
      updateView();
    } else {
      loginView();
    }
  });
});

// View

function updateView() {
  const html = document.getElementById("app");
  const nickname = game.app.username;
  const result = drawResult();
  const pts = userPoints();
  const rank = userRank();
  html.innerHTML = "";
  html.innerHTML += /*HTML*/ `
  <div class="head">
    <div style="display: flex; flex-direction: column; font-weight: bold;">
      <div>Current Rank: ${rank}.</div>
      <div>Total Points: ${pts}.</div>
    </div>
    <div></div>
    <div>Hello, <b>${nickname}</b> 
      <button class="logout logout-btn">Log out</button>
    </div>
  </div>

  <h1>Are you on the leaderboard yet?</h1>

  <div class="main-container">
    <div class="leaderboard">
      <div class="info-text">
      Leaderboard
      </div>

      <div class="dbl-container">
        <div class="lb-left">
          <div class="info-text">-Most Points-
            <div title="Earn points by completing rounds. (n / time) - faster = more points!">
              <svg class="info-icon" fill="#000000" xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 32 32" width="20px" height="20px"><path d="M 16 3 C 8.832031 3 3 8.832031 3 16 C 3 23.167969 8.832031 29 16 29 C 23.167969 29 29 23.167969 29 16 C 29 8.832031 23.167969 3 16 3 Z M 16 5 C 22.085938 5 27 9.914063 27 16 C 27 22.085938 22.085938 27 16 27 C 9.914063 27 5 22.085938 5 16 C 5 9.914063 9.914063 5 16 5 Z M 15 10 L 15 12 L 17 12 L 17 10 Z M 15 14 L 15 22 L 17 22 L 17 14 Z"/></svg>
            </div>
          </div>
          <div class="lb-container">
            ${showLeaderboard()}
          </div>
        </div> 
        <div class="lb-right">      
          <div class="info-text">-Top 10 Fastest Rounds-
          </div>
          <div class="lb-container">
            ${fastestTimes()}
          </div>
        </div>
      </div>
    </div>
    ${`<div class="game">${createBoard()}</div>`}
    <div class="info">
      <div class="info-text">
        One round = 10 hits.
      </div>
      <div class="results">
        ${result}
      </div>
      <div class="historic">
        ${userScores()}
      </div>
    </div>
  </div>
`;

  const gameButton = document.querySelector(".lightOn");
  gameButton.addEventListener("click", hits);

  const logoutButton = document.querySelector(".logout");
  logoutButton.addEventListener("click", () => {
    signOut(auth)
      .then(() => {
        logout();
      })
      .catch((err) => {
        console.log(err.message);
      });
  });
}

function loginView() {
  const html = document.getElementById("app");
  const view = game.app.view;
  html.innerHTML = "";
  html.innerHTML += /*HTML*/ `
  <div class="head"></div>
  <h1>Welcome to a simple aim trainer!</h1>
  <div class="main-container">
    <div class="leaderboard"></div>
    ${view === "signup" ? `${createUser()}` : `${loginScreen()}`}
    <div class="info">
    </div>
  </div>
`;

  if (game.app.view === "signup") {
    const signupForm = document.querySelector(".signup");
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const auth = getAuth();
      const email = signupForm.email.value;
      const password = signupForm.password.value;
      createUserWithEmailAndPassword(auth, email, password)
        .then(() => {
          game.input.username = signupForm.username.value;
          setupUser();
          signupForm.reset();
        })
        .catch((err) => {
          console.log(err.message);
        });
    });
  }

  //  logging in and out

  if (game.app.view === "") {
    const loginForm = document.querySelector(".login");
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = loginForm.email.value;
      const password = loginForm.password.value;
      signInWithEmailAndPassword(auth, email, password)
        .then(() => {})
        .catch((err) => {
          console.log(err.message);
        });
    });
  }

  if (game.app.view === "") {
    const newUserButton = document.querySelector(".toSignup");
    newUserButton.addEventListener("click", () => {
      game.app.view = "signup";
      loginView();
    });
  }
}

function showLeaderboard() {
  let pointArray = [];
  let points = 0;
  const users = game.data.users;
  const scores = game.data.scores;

  for (let i = 0; i < users.length; i++) {
    for (let j = 0; j < scores.length; j++) {
      if (users[i].id === scores[j].id) {
        points = points + scores[j].points;
      }
    }
    let data = {
      id: users[i].id,
      name: users[i].username,
      pts: points,
    };
    pointArray.push(data);
    points = 0;
  }

  const sorted = [...pointArray].sort((a, b) => {
    return b.pts - a.pts;
  });

  const scoreboard = sorted.map((user) => {
    return /*HTML*/ `
    <div class="lb-line">
      <div class="lb-text">
        ${user.name}:
      </div>
      <div class="lb-text">
        ${user.pts}
      </div>
    </div>`;
  });
  return scoreboard.join("");
}

function fastestTimes() {
  const users = game.data.users;
  const scores = game.data.scores;
  let timeArr = [];

  for (let i = 0; i < users.length; i++) {
    for (let j = 0; j < scores.length; j++) {
      if (users[i].id === scores[j].id) {
        let data = {
          id: users[i].id,
          name: users[i].username,
          time: scores[j].time,
        };
        timeArr.push(data);
      }
    }
  }

  const sorted = [...timeArr].sort((a, b) => {
    return a.time - b.time;
  });
  let fastest = "";
  for (let i = 0; i < 10; i++) {
    fastest += `
    <div class="lb-line-fast">
      <div class="fast-rank">${i + 1}. </div>
      <div class="lb-text-fast">${sorted[i].name}:</div>
      <div class="lb-num-fast">${sorted[i].time.toFixed(2)}</div>
    </div>`;
  }
  return fastest;
}

function userScores() {
  const scores = game.data.scores;
  const list = [...scores].filter((score) => score.id === game.app.user);
  list.sort((a, b) => {
    if (a.date > b.date) {
      return -1;
    }
    if (b.date > a.date) {
      return 1;
    }
    return 0;
  });
  let userHtml = "";
  for (let i = 0; i < list.length; i++) {
    let date = new Date(list[i].date);

    userHtml += /*HTML*/ `
    <div class="userScore">
      <div class="userScore-text">
        ${list[i].time}s 
      </div>
      <div class="userScore-text">
        ${date.toLocaleTimeString("no-NO", {
          hour: "2-digit",
          minute: "2-digit",
        })},  ${date.toLocaleDateString("no-NO", { year: "2-digit", month: "2-digit", day: "2-digit" })}
      </div>
    </div>
    `;
  }
  return userHtml;
}

function createBoard() {
  let gameHtml = "";
  let counter = game.input.reactionTime.length;
  let randomDiv = Math.floor(Math.random() * 25);
  for (let i = 0; i < 25; i++) {
    if (game.input.startTime == 0) {
      if (i == 12) {
        gameHtml += `<div class="lightOn">Start!</div>`;
      } else {
        gameHtml += `<div class="lamp"></div>`;
      }
    }
    if (game.input.startTime != 0) {
      if (randomDiv == i) {
        gameHtml += `<div class="lightOn">${counter + 1}</div>`;
      } else {
        gameHtml += `<div class="lamp"></div>`;
      }
    }
  }
  return gameHtml;
}

function logout() {
  game.app.view = "";
  loginView();
}
function loginScreen() {
  let loginHtml = "";
  loginHtml = /*HTML*/ `
    <div class="login-container">
      <div class="login-card">
        <form class="login">
          <div class="user-input">
            <label for="email">Email:</label>
            <input type="email" name="email"/>
          </div>
          <div class="user-input">
            <label for="password">Password:</label>
            <input type="password" name="password"/>
          </div>
          <div class="btn-container">
            <button class="login-btn">Login</button>
        </form>
            <div style="width: 10%;"></div>
            <button type="button" class="toSignup login-btn">Sign up?</button>
          </div>
      </div>
    </div>
    `;

  return loginHtml;
}

function createUser() {
  let signupHtml = "";
  signupHtml = /*HTML*/ `
  <div class="login-container">
    <div class="login-card" style="height: 35%;">
      <form class="signup">
        <div class="user-input">
          <label for="usersname">Choose your username:</label>
          <input type="text" name="username"/>
        </div>
        <div class="user-input">
          <label for="email">Enter your email:</label>
          <input type="email" name="email"/>
        </div>
        <div class="user-input">
          <label for="password">Create password:</label>
          <input type="password" name="password"/>
        </div>

        <div class="btn-container">
          <button class="login-btn">Sign up</button>
          <div style="width: 10%;"></div>
          <button type="button" class="cancel login-btn">Cancel</button>
        </div>
      </form>
    </div>
  </div>
  `;
  return signupHtml;
}

function hits() {
  let reactionTime = game.input.reactionTime;

  if (game.input.startTime == 0) {
    game.input.startTime = new Date().getTime();
    game.input.misses = 0;
  } else {
    game.input.finishTime = new Date().getTime();
    let reaction = Math.floor(game.input.finishTime - game.input.startTime);
    reactionTime.push(reaction);
    game.input.startTime = new Date().getTime();
    game.input.finishTime = 0;
  }
  if (reactionTime.length == 10) {
    game.input.roundTime = game.input.reactionTime;
    game.input.reactionTime = [];
    game.input.startTime = 0;
  }
  updateView();
}

function drawResult() {
  if (game.input.roundTime.length === 10) {
    let roundTime = game.input.roundTime;
    let userId = game.app.user;
    let showScore = "";

    const sum = roundTime.reduce(function (a, b) {
      return a + b;
    }, 0);
    game.input.roundTime = [];
    game.input.startTime = 0;

    const totalTime = sum / 1000;
    const pts = Math.floor(50 / totalTime);

    let newScore = {
      id: userId,
      points: pts,
      time: totalTime,
      date: new Date().toISOString(),
    };

    addDoc(colRef, newScore); //firebase

    let scores = game.data.scores;
    scores.push(newScore);
    let bestTime = scores.filter((item) => item.id == userId);
    bestTime.sort((a, b) => {
      if (a.time > b.time) {
        return 1;
      }
      if (b.time > a.time) {
        return -1;
      }
      return 0;
    });
    showScore += /*HTML*/ `
  <div>
  <div>
  Din beste tid er: ${bestTime[0].time}
  </div>
  </div>`;
    return showScore;
  } else {
    return "";
  }
}

function userPoints() {
  const scores = game.data.scores;
  const userRounds = scores.filter((user) => user.id === game.app.user);
  const userPts = userRounds.reduce(function (a, b) {
    return a + b.points;
  }, 0);
  return userPts;
}

function userRank() {
  let pointArray = [];
  let points = 0;
  const users = game.data.users;
  const scores = game.data.scores;

  for (let i = 0; i < users.length; i++) {
    for (let j = 0; j < scores.length; j++) {
      if (users[i].id === scores[j].id) {
        points = points + scores[j].points;
      }
    }
    let data = {
      id: users[i].id,
      name: users[i].username,
      pts: points,
    };
    pointArray.push(data);
    points = 0;
  }

  const sorted = [...pointArray].sort((a, b) => {
    return b.score - a.score;
  });
  const myUser = game.app.username;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].name == myUser) {
      return i + 1;
    }
  }
}

// signing users up

function setupUser() {
  const user = auth.currentUser;
  const email = user.email;
  const idNum = game.data.users.length + 1;

  if (user !== null) {
    updateProfile(user, {
      displayName: game.input.username,
    })
      .then(() => {
        const addUser = {
          email: email,
          username: game.input.username,
          id: idNum,
        };
        addDoc(userRef, addUser);
      })
      .catch((err) => {
        console.log(err.message);
      });
  }
}

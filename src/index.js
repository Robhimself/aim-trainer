//
import { initializeApp } from "firebase/app";
import { collection, onSnapshot, getFirestore, query, where, addDoc } from "firebase/firestore";
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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore();

const colRef = collection(db, "scores");

// Model
const game = {
  app: {
    user: 123,
    view: "",
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
    users: [
      {
        id: 123,
        name: "Robert",
        username: "Robhimself",
        score: 0,
      },
      {
        id: 124,
        name: "Simen",
        username: "dankert",
        score: 10,
      },
      {
        id: 125,
        name: "David",
        username: "David",
        score: 50,
      },
    ],
    scores: [],
  },
};

// get real time collection data
const q = query(colRef, where("id", "==", game.app.user));
onSnapshot(q, (snapshot) => {
  let getScores = [];
  snapshot.docs.forEach((doc) => {
    getScores.push({ ...doc.data() });
  });
  game.data.scores = getScores;
  console.log(game.data.scores);
});

// View

function updateView() {
  const html = document.getElementById("app");
  const view = game.app.view;
  html.innerHTML = "";
  html.innerHTML += /*HTML*/ `
  <div class="head">
    <div></div>
    <div>Welcome to Aim Trainer, ${game.app.user}.</div>
    <div>
    <button class="change-name logout-btn">Change username?</button>
    <button class="logout logout-btn">Log out</button>
    </div>
  </div>
  <h1>Aim Trainer v.0.9</h1>
  <div class="main-container">
    <div class="leaderboard">
      <div class="info-text">
      Leaderboard
      </div>

      <div class="lb-container">
      ${showLeaderboard()}
      </div>
  </div>
  ${`<div class="game">${createBoard()}</div>`}
  <div class="info">
  <div class="info-text">
  Ett spill = 10 treff.
  </div>
  <div class="results">
  ${game.input.roundTime.length == 10 ? drawResult() : ""}
  </div>
  <div class="historic">
  ${userScores()}
  </div>
  </div>
  </div>
  <div class="modal">
    <div class="modal-content">
    <button class="namechange">Change it!</button>
    <label for="username">Write your new username.</label>
    <input type="text" name="new-name">
    <button class="close-modal">Close</button>
    </div>
  </div>
`;

  const gameButton = document.querySelector(".lightOn");
  gameButton.addEventListener("click", hits);

  const logoutButton = document.querySelector(".logout");
  logoutButton.addEventListener("click", () => {
    signOut(auth)
      .then(() => {
        console.log("the user signed out");
        logout();
      })
      .catch((err) => {
        console.log(err.message);
      });
  });
}

// loginView();
function loginView() {
  const html = document.getElementById("app");
  const view = game.app.view;
  html.innerHTML = "";
  html.innerHTML += /*HTML*/ `
  <div class="head">
  </div>
  <h1>Getting started with firebase 9 now!</h1>
  <div class="main-container">
    <div class="leaderboard"></div>
  
  ${view === "signup" ? `${createUser()}` : `${loginScreen()}`}
  
  <div class="info">
  </div>
  </div>
`;

  //  logging in and out

  if (game.app.view === "") {
    const loginForm = document.querySelector(".login");
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = loginForm.email.value;
      const password = loginForm.password.value;
      signInWithEmailAndPassword(auth, email, password)
        .then((cred) => {
          console.log("user logged in: ", cred.user);
          loginAuth();
        })
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

if (game.app.view === "") {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      game.app.view = "game";
      updateView();
    } else {
      loginView();
    }
  });
}

function showLeaderboard() {
  const users = game.data.users;
  const sorted = [...users].sort((a, b) => {
    return b.score - a.score;
  });

  const scoreboard = sorted.map((user) => {
    return /*HTML*/ `
                    <div class="lb-line">
                      <div class="lb-text">
                        ${user.username}:
                      </div>
                      <div class="lb-text">
                        ${user.score}
                      </div>
                    </div>`;
  });
  return scoreboard.join("");
}

// filter players to arrays. reduce pts. map out users.

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
      </div><div class="userScore-text">
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

function loginAuth() {
  game.app.view = "game";

  updateView();
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
                <button class="toSignup login-btn">Sign up?</button>
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
              <div class="login-card">
                <form class="signup">
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
                      </form>
                      <div style="width: 10%;"></div>
                      <button class="cancel login-btn">Cancel</button>
                    </div>
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
  let roundTime = game.input.roundTime;
  let scores = game.data.scores;
  let userId = game.app.user;
  let showScore = "";

  const sum = roundTime.reduce(function (a, b) {
    return a + b;
  }, 0);
  game.input.roundTime = [];
  game.input.startTime = 0;

  const totalTime = sum / 1000;
  const pts = Math.floor(50 / totalTime);

  // points: pts,
  let newScore = {
    id: userId,
    points: pts,
    time: totalTime,
    date: new Date().toISOString(),
  };

  addDoc(colRef, newScore); //firebase

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
}

// signing users up
if (game.app.view === "signup") {
  const signupForm = document.querySelector(".signup");
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = signupForm.email.value;
    const password = signupForm.password.value;
    createUserWithEmailAndPassword(auth, email, password)
      .then((cred) => {
        console.log("user created: ", cred.user);
        signupForm.reset();
        loginAuth();
      })
      .catch((err) => {
        console.log(err.message);
      });
  });
}

function updateProfileName() {
  const newName = game.input.username;
  const auth = getAuth();
  const user = auth.currentUser;
  const displayName = user.displayName;
  if (user !== null) {
    updateProfile(user, {
      displayName: newName,
    })
      .then(() => {
        alert("username has been changed to: ", displayName);
      })
      .catch((err) => {
        console.log(err.message);
      });
  }
}

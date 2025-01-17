const key = "qTc-Sg.ttDEDg:pwjyLkm4dt5KEOhux8vE8j0nPIgZEFqnOLS8E_KUsLo";

// Game logic variables
let myChoice = "none";
let opponentChoice = "none";
let myScore = 0;
let oppScore = 0;
let userCount = "0";
let twoPlayers = false;
let loopingDots = false;
let channelInfoName = "";
// Ably realtime vars
const realtime = new Ably.Realtime({ key, clientId: "user-" + Math.random().toString(36).substr(2, 9) });
let channel;
let clientId;

function onStart()  {
  //hide the game and enter and show the homescreen
  document.getElementById("channelDiv").style.display = "block";
  document.getElementById("gameDiv").style.display = "none";
  document.getElementById("leaveButton").style.display = "none";
  document.getElementById("winner").style.display = "none";
  document.getElementById("pvc").style.display = "none";
  myScore = 0;
  oppScore = 0;
}
window.onload = onStart;
//window.onload = connectToChannel("general");
// Connect to Ably
realtime.connection.once("connected", async () => {
  clientId = realtime.connection.id;
  console.log("Connected to Ably with clientId: " + clientId);
});

async function connectToChannel(channelName) {
  // Connect to the channel

  channel = realtime.channels.get(channelName);
  console.log("Connected to channel: " + channelName);
  channelInfoName = channelName;
  // Call checkUserCount to get the current number of users
  await checkUserCount();

  // Subscribe to presence updates to dynamically update user count
  channel.presence.subscribe(() => {
    checkUserCount(); // Keep checking the user count when presence updates
  });

  // Proceed with your other logic
  doPubSub(channelName);
}

async function doPubSub(channelName) {
  // Enter presence on the channel
  await channel.presence.enter();

  // Check the number of people in the channel
  const members = await channel.presence.get();
  console.log("Number of people in channel: " + channel.name + members.length);

  // Check if we're in "general" channel, if yes, allow unlimited members
  if (channelName != "general" && members.length > 2) {
    console.log("Redirecting to 'general' due to more than 2 people in the channel.");
    connectToChannel("general");
    return;
  }

// Subscribe to presence updates
channel.presence.subscribe(async () => {
  userCount = members.length; // Update the userCount variable
  console.log("Updated user count: " + userCount);
  
  // Display user count (optional, if you have an element to show this)
  const userCountElement = document.getElementById("userCount");
  if (userCountElement) {
    userCountElement.innerText = "Players in Game:" + userCount;
  }

  // Redirect if more than 2 players in non-"general" channel
  if (channelName != "general" && members.length > 2) {
    console.log("Redirecting to 'general' due to more than 2 people in the channel.");
    connectToChannel("general");
  }
});

  // Subscribe to receive messages
  channel.subscribe((event) => {
    const message = event.data;
    if (message.senderId != clientId) {
      opponentChoice = message.choice;
      //console.log("Opponent Chose: " + opponentChoice);
      check();
    }
  });

  // Button click event handlers
  document.getElementById("rock").addEventListener("click", () => {
    sendChoice("rock");
  });
  document.getElementById("paper").addEventListener("click", () => {
    sendChoice("paper");
  });
  document.getElementById("scissors").addEventListener("click", () => {
    sendChoice("scissors");
  });

  // Function to publish a message
  function sendChoice(choice) {
    document.getElementById("buttonsDiv").style.display = "none";
    channel.publish("choice", { choice, senderId: clientId });
    //console.log("Sent choice:", choice);
    myChoice = choice;
    check();
  }
}

function check() {
  if (myChoice == "none") {
    console.log("Waiting for your choice...");
  } else if (opponentChoice == "none") {
    console.log("Waiting for opponent's choice...");
  } else {
    calculate();
    document.getElementById("buttonsDiv").style.display = "block";
  }
}

function calculate() {
  //console.log("Choices:", myChoice, opponentChoice);

  if (myChoice == opponentChoice) {
    console.log("Tie!");
    document.getElementById("calWin").innerHTML = "Tie!";
    document.getElementById("calWin").style.color = "black";
  } else if (myChoice == "paper" && opponentChoice == "rock") {
    console.log("Paper Covers Rock! You Win!");
    document.getElementById("calWin").innerHTML = "Paper Covers Rock! You Win!";
    document.getElementById("calWin").style.color = "green";
    myScore++;
  } else if (myChoice == "scissors" && opponentChoice == "rock") {
    console.log("Rock Beats Scissors! Opponent Wins!");
    document.getElementById("calWin").innerHTML = "Rock Beats Scissors! Opponent Wins!";
    document.getElementById("calWin").style.color = "red";
    oppScore++;
  } else if (myChoice == "rock" && opponentChoice == "paper") {
    console.log("Paper Beats Rock! Opponent Wins!");
    document.getElementById("calWin").innerHTML = "Paper Beats Rock! Opponent Wins!";
    document.getElementById("calWin").style.color = "red";
    oppScore++;
  } else if (myChoice == "scissors" && opponentChoice == "paper") {
    console.log("Scissors Cuts Paper! You Win!");
    document.getElementById("calWin").innerHTML = "Scissors Cuts Paper! You Win!";
    document.getElementById("calWin").style.color = "green";
    myScore++;
  } else if (myChoice == "rock" && opponentChoice == "scissors") {
    console.log("Rock Smashes Scissors! You Win!");
    document.getElementById("calWin").innerHTML = "Rock Smashes Scissors! You Win!";
    document.getElementById("calWin").style.color = "green";
    myScore++;
  } else if (myChoice == "paper" && opponentChoice == "scissors") {
    console.log("Scissors Cuts Paper! Opponent Wins!");
    document.getElementById("calWin").innerHTML = "Scissors Cuts Paper! Opponent Wins!";
    document.getElementById("calWin").style.color = "red";
    oppScore++;
  }
    if (myChoice == "rock") {
    document.getElementById("myImg").src = "imgs/Throws/rock.png";
  } else if (myChoice == "paper") {
    document.getElementById("myImg").src = "imgs/Throws/paper.png";
  } else {
    document.getElementById("myImg").src = "imgs/Throws/scissors.png";
  }
  
  if (opponentChoice == "rock") {
    document.getElementById("oppImg").src = "imgs/Throws/rock.png";
  } else if (opponentChoice == "paper") {
    document.getElementById("oppImg").src = "imgs/Throws/paper.png";
  } else {
    document.getElementById("oppImg").src = "imgs/Throws/scissors.png";
  }
  
  document.getElementById("scores").innerHTML = "My Score: " + myScore + " " + "Opponent Score: " + oppScore;
  if (myScore == 3) {
    win("me");
  } else if (oppScore == 3) {
    win("opp");
  }
  myChoice = "none";
  opponentChoice = "none";
}

function win(winner) {
    twoPlayers = false;
    document.getElementById("buttonsDiv").style.display = "none";
    document.getElementById("gameDiv").style.display = "none";
    document.getElementById("winner").style.display = "block";
    document.getElementById("calWin").innerHTML = "";
    document.getElementById("calWin").style.color = "black";
    document.getElementById("pvc").style.display = "none";
    myScore = 0;
    oppScore = 0;
    myChoice = "none";
    computer = "none";
    opponentChoice = "none";
  if (winner == "opp") {
    console.log("You lost :(");
    document.getElementById("winnerResult").innerHTML = "You Lost :(";
    document.getElementById("winnerResult").style.color = "red";
  } else if (winner == "me") {
    console.log("You Won!");
    document.getElementById("winnerResult").innerHTML = "You Won!";
    document.getElementById("winnerResult").style.color = "green";
  }
  setTimeout(() => closeWinnerTab(), 1000);
}
function closeWinnerTab() {
  document.getElementById("leaveButton").style.display = "block";
}
// Example usage: Connect to a channel
function connectChannel() {
  if (document.getElementById("channelInput") == "") {
  console.log("need to input a channel");
  } else  {
    let channelName = document.getElementById("channelInput").value || "general"; // Default to "general" if no input
    connectToChannel(channelName);
    startGame();
    }
  }

async function autoConnect() {
  console.log("Auto Connecting...");
  let channelNumber = 1;

  while (true) {
    let channelName = channelNumber;  // Use just the number (1, 2, 3, etc.)
    let channel = realtime.channels.get(channelName);

    const members = await channel.presence.get();
    console.log("Checking" + channelName + ":" + members.length + "members");

    if (members.length == 0 || members.length < 2) {
      console.log("Connecting to " + channelName);
      await connectToChannel(channelName);  // Await the connection
      startGame();
      break;
    }

    channelNumber++;
  }
}

function startGame()  {
    document.getElementById("calWin").innerHTML = "My Score: 0 Opponent Score: 0";
    document.getElementById("channelDiv").style.display = "none";
    document.getElementById("gameDiv").style.display = "block";
    document.getElementById("channelInfo").innerHTML = "Current Lobby Name: " + channelInfoName ;
}

async function checkUserCount() {
  const members = await channel.presence.get();
  if (members.length == 1) {
    console.log("Only one user is present in the channel.");
    //waiting until new player arrives
    loopingDots = true;
    loopDots();
    twoPlayers = false;
    document.getElementById("leaveButton").style.display = "block";
  } else {
    console.log("there are " + members.length +" users present in the channel");
    loopingDots = false;
    twoPlayers = true;
    document.getElementById("leaveButton").style.display = "none";
  }
}
function leaveGame()  {
  twoPlayers = false;
  oppScore = 0;
  myscore = 0;
  connectToChannel("general");
  document.getElementById("channelDiv").style.display = "block";
  document.getElementById("gameDiv").style.display = "none";
  document.getElementById("winner").style.display = "none";
  document.getElementById("leaveButton").style.display = "none";
}
let waitingDots = [".","..","..."];
let waitingItt = 0;

async function loopDots() {
  if (loopingDots)  {
  document.getElementById("info").innerHTML = "Waiting for another player"+waitingDots[waitingItt];
  waitingItt++;
  document.getElementById("buttonsDiv").style.display = "none";
  if (waitingItt == 3)  {
    waitingItt = 0;
    }
    setTimeout(() => loopDots(), 500);
  } else  {
    document.getElementById("buttonsDiv").style.display = "block";
    document.getElementById("info").innerHTML = "";
  }
}

function playPvc()  {
  document.getElementById("pvc").style.display = "block";
  document.getElementById("channelDiv").style.display = "none";
  myChoice = "rock";
  document.getElementById("oppImg1").src = "imgs/Throws/rock.png";
}

function pvc(myChoice)  {
  let computerThrow = ["rock","paper","scissors"];
  var computerNum = Math.floor(Math.random()*2);
  let computer = computerThrow[computerNum];
  
    console.log(myChoice , computer);
  if (myChoice == "rock") {
    document.getElementById("myImg1").src = "imgs/Throws/rock.png";
  } else if (myChoice == "paper") {
    document.getElementById("myImg1").src = "imgs/Throws/paper.png";
  } else {
    document.getElementById("myImg1").src = "imgs/Throws/scissors.png";
  }
  if (computer == "rock") {
    document.getElementById("oppImg1").src = "imgs/Throws/rock.png";
  } else if (computer == "paper") {
    document.getElementById("oppImg1").src = "imgs/Throws/paper.png";
  } else {
    document.getElementById("oppImg1").src = "imgs/Throws/scissors.png";
  }
  if (myChoice == computer) {
    console.log("Tie!");
    document.getElementById("calWin1").innerHTML = "Tie!";
    document.getElementById("calWin1").style.color = "black";
  } else if (myChoice == "paper" && computer == "rock") {
    console.log("Paper Covers Rock! You Win!");
    document.getElementById("calWin1").innerHTML = "Paper Covers Rock! You Win!";
    document.getElementById("calWin1").style.color = "green";
    myScore++;
  } else if (myChoice == "scissors" && computer == "rock") {
    console.log("Rock Beats Scissors! Opponent Wins!");
    document.getElementById("calWin1").innerHTML = "Rock Beats Scissors! Opponent Wins!";
    document.getElementById("calWin1").style.color = "red";
    oppScore++;
  } else if (myChoice == "rock" && computer == "paper") {
    console.log("Paper Beats Rock! Opponent Wins!");
    document.getElementById("calWin1").innerHTML = "Paper Beats Rock! Opponent Wins!";
    document.getElementById("calWin1").style.color = "red";
    oppScore++;
  } else if (myChoice == "scissors" && computer == "paper") {
    console.log("Scissors Cuts Paper! You Win!");
    document.getElementById("calWin1").innerHTML = "Scissors Cuts Paper! You Win!";
    document.getElementById("calWin1").style.color = "green";
    myScore++;
  } else if (myChoice == "rock" && computer == "scissors") {
    console.log("Rock Smashes Scissors! You Win!");
    document.getElementById("calWin1").innerHTML = "Rock Smashes Scissors! You Win!";
    document.getElementById("calWin1").style.color = "green";
    myScore++;
  } else if (myChoice == "paper" && computer == "scissors") {
    console.log("Scissors Cuts Paper! Opponent Wins!");
    document.getElementById("calWin1").innerHTML = "Scissors Cuts Paper! Opponent Wins!";
    document.getElementById("calWin1").style.color = "red";
    oppScore++;
  }
    document.getElementById("scores1").innerHTML = "My Score: " + myScore + " " + "Computer Score: " + oppScore;
  if (myScore == 3) {
    win("me");
    myScore = 0;
    oppScore = 0;
  } else if (oppScore == 3) {
    win("opp");
    oppScore = 0;
    myScore = 0;
  }
  
}

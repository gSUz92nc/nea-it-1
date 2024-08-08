// Global variables
let userKnowledgeLevel: number = 5;
let userID: number = 0;
let currentReviewLevels: {
  id: number;
  nextReview: number;
  score: number;
  userID: number;
}[] = [];
let allUserData: {
  id: number;
  currentReviewLevels: {}[];
}[] = JSON.parse(await Bun.file("data/userData.json").text());
let userData: { id: number; currentReviewLevels: {}[] };

// Helper functions
function needsReview(word: { JLPTLevel: number; id: number }) : void {
  
}

function saveUserData(data: { id: number; currentReviewLevels: {}[] }) {
  // Find the ID of the user in the array
  // Replace the user data with the new data
  // Save the new data to the file

  let index = allUserData.findIndex((user) => user.id == userID);
  allUserData[index] = data;
  Bun.write("data/userData.json", JSON.stringify(allUserData));
}

function search(searchId: number) : number | null {
  let lowerBound : number = 0;
  let upperBound : number = currentReviewLevels.length - 1;
  let middle: number;

  while (lowerBound < upperBound) {
    middle = Math.floor((upperBound + lowerBound) % 2);

    if (currentReviewLevels[middle].id == searchId) {
      return middle;
    }

    if (currentReviewLevels[middle].id > searchId) {
      upperBound = middle - 1;
    } else {
      lowerBound = middle + 1;
    }
  }

  return null;
}

// Code entry point

process.stdout.write("What is youre ID?\n");

// No clean way to read input from CLI in Bun
for await (const line of console) {
  userID = parseInt(line);
  break;
}

// Check if the user ID exists and then save the index
const userIndex : number = allUserData.findIndex((user) => user.id == userID);

if (userIndex != -1) {
  process.stdout.write("User ID found. Loading user data...\n");

  userData = allUserData[userIndex];

  console.log(userData);

  saveUserData(userData);
} else {
  process.stdout.write("User ID not found. Creating new user...\n");

  // Save user ID to ./data/userData.json
  Bun.write(
    "data/userData.json",
    JSON.stringify([...allUserData, { id: userID }]),
  );
}



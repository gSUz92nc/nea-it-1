// Types

type ReviewLevel = {
  id: number;
  nextReview: number;
  score: number;
  userID: number;
};

type UserData = {
  id: number;
  knowledgeLevel: number;
  currentReviewLevels: ReviewLevel[];
};

type Word = {
  JLPTLevel: number;
  id: number;
};

// Global variables
let userKnowledgeLevel: number = 5;
let userID: number = 0;
let currentReviewLevels: ReviewLevel[] = [];
let allUserData: UserData[] = JSON.parse(
  await Bun.file("data/userData.json").text(),
);
let userData: UserData;

// Helper functions
function needsReview(word: Word): boolean {
  // Check if the word is in the current review levels
  let index = searchReviews(word.id);

  // If the word is not in the current review levels, add it
  if (index == null) {
    currentReviewLevels.push({
      id: word.id,
      nextReview: Date.now(),
      score: 0,
      userID: userID,
    });

    return true;
  } else {
  }

  return false;
}
// Save user data to the file
function saveUserData(data: UserData) {
  // Get the index of the user in the allUserData array
  let index = allUserData.findIndex((user) => user.id == userID);

  // If not found create a new user else update the existing user
  if (index == -1) {
    allUserData.push(data);
    Bun.write("data/userData.json", JSON.stringify(allUserData));
  } else {
    allUserData[index] = data;
    Bun.write("data/userData.json", JSON.stringify(allUserData));
  }
}

// Binary search function for the current review levels
function searchReviews(searchId: number): number | null {
  let lowerBound: number = 0;
  let upperBound: number = currentReviewLevels.length - 1;
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

async function loadUser(id: number): Promise<UserData> {
  // Check if the user ID exists and then save the index
  const userIndex = allUserData.findIndex((user) => user.id == userID);

  if (userIndex != -1) {
    process.stdout.write("User ID found. Loading user data...\n");

    const data = allUserData[userIndex];

    saveUserData(data);
    return data;
  } else {
    process.stdout.write("User ID not found. Creating new user...\n");

    // Get the user's knowledge level
    userKnowledgeLevel = parseInt(prompt("What is your knowledge level?\n") || "5");
    
    const userTemplate: UserData = {
      id: userID,
      knowledgeLevel: userKnowledgeLevel,
      currentReviewLevels: [],
    }

    // Save user ID to ./data/userData.json and return
    saveUserData(userTemplate);
    return userTemplate;
  }
}

async function main() {
  /* Code entry point */

  // Load user data
  userData = await loadUser(parseInt(prompt("What is youre ID?\n") || "0"));
  currentReviewLevels = userData.currentReviewLevels; // Set the current review levels globally
}

main();

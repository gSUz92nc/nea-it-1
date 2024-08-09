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
  term: string;
  definition: string;
};

// Global variables
const words: Word[] = JSON.parse(await Bun.file("data/dictionary.json").text());
let userID: number = 0;
let allUserData: UserData[] = JSON.parse(
  await Bun.file("data/userData.json").text(),
);
let userData: UserData = {
  id: 0,
  knowledgeLevel: 0,
  currentReviewLevels: [],
};

// Helper functions
function needsReview(word: Word): boolean {
  // Check if the word is above the user's knowledge level
  if (word.JLPTLevel > userData.knowledgeLevel) {
    return false;
  }

  // Check if the word is in the current review levels
  let index = searchReviews(word.id);

  // If the word is not in the current review levels return true
  if (index == null) {
    return true;
  } else {
    if (userData.currentReviewLevels[index].nextReview < Date.now()) {
      return true;
    }
  }

  return false;
}
// Save user data to the file
function saveUserData(data: UserData) {
  // Get the index of the user in the allUserData array
  let index = allUserData.findIndex((user) => user.id == data.id);

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
  let upperBound: number = userData.currentReviewLevels.length - 1;
  let middle: number;

  while (lowerBound < upperBound) {
    middle = Math.floor((upperBound + lowerBound) % 2);

    if (userData.currentReviewLevels[middle].id == searchId) {
      return middle;
    }

    if (userData.currentReviewLevels[middle].id > searchId) {
      upperBound = middle - 1;
    } else {
      lowerBound = middle + 1;
    }
  }

  return null;
}

async function loadUser(id: number): Promise<UserData> {
  // Check if the user ID exists and then save the index
  const userIndex = allUserData.findIndex((user) => user.id == id);

  console.log("User Index:", userIndex);

  if (userIndex != -1) {
    process.stdout.write("User ID found. Loading user data...\n");

    const data = allUserData[userIndex];

    saveUserData(data);
    return data;
  } else {
    process.stdout.write("User ID not found. Creating new user...\n");

    let knowledgeLevel: number;
    do {
      knowledgeLevel = parseInt(
        prompt("What is your knowledge level (1-5)?\n") || "5",
      );
      if (knowledgeLevel < 1 || knowledgeLevel > 5) {
        console.log("Invalid input. Please enter a number between 1 and 5.");
      }
    } while (knowledgeLevel < 1 || knowledgeLevel > 5);

    // Generate template to be saved and returned
    const userTemplate: UserData = {
      id: id,
      knowledgeLevel: knowledgeLevel,
      currentReviewLevels: [],
    };

    // Save user ID to ./data/userData.json and return
    saveUserData(userTemplate);
    return userTemplate;
  }
}

function generateQuestion(word: Word | null) {
  if (word == null) {
    process.stdout.write("You have no words to review. Good job!\n");
    process.exit();
  }

  return `This is a placeholder question for the word: ${word.term}`;
}

async function main() {
  /* Code entry point */

  // Load user data
  let inputID: string | null = prompt("What is your ID?\n");

  while (isNaN(Number(inputID))) {
    process.stdout.write("Invalid input. Please enter a number.\n");
    inputID = prompt("What is your ID?\n");
  }

  userData = await loadUser(parseInt(inputID || "0"));

  // Loop through the words and check if they need review
  for (let word of words) {
    if (!needsReview(word)) {
      continue;
    }

    const question = generateQuestion(word);

    console.log(question);

    // Check if the user wants to continue if not save and close
    if (prompt("Do you want to continue? (y/n)\n") == "n") {
      saveUserData(userData);
      process.stdout.write("Bye bye!\n");
      process.exit();
    }
  }
}

main();

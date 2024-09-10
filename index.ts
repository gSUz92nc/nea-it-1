// Types

type ReviewLevel = {
  id: number;
  nextReview: number;
  score: number;
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
  } else {
    allUserData[index] = data;
  }
    Bun.write("data/userData.json", JSON.stringify(allUserData));
}

// Search function for the current review levels
function searchReviews(searchId: number): number | null {
  
  const index = userData.currentReviewLevels.findIndex(
    (review) => review.id === searchId,
  );
  
  if (index == -1) {
    return null;
  }
  
  return index;
}

async function loadUser(id: number): Promise<UserData> {
  // Check if the user ID exists and then save the index
  const userIndex = allUserData.findIndex((user) => user.id == id);

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
        process.stdout.write(
          "Invalid input. Please enter a number between 1 and 5.",
        );
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
    process.stdout.write("You have covered all your words. Good job!\n");
    process.exit();
  }

  // Randomize whther to show the definition or the term
  const showDefinition: boolean = Math.random() > 0.5;

  // Generate 3 wrong answers of the same JLPT level
  const sameLevelWords = words.filter(
    (w) => w.JLPTLevel === word.JLPTLevel && w.id !== word.id,
  );
  const shuffledWords = sameLevelWords.sort(() => 0.5 - Math.random());
  const wrongAnswers = shuffledWords
    .slice(0, 3)
    .map((w) => (showDefinition ? w.definition : w.term));

  // Display the question in a readable format and the random order
  process.stdout.write(
    `Question: ${showDefinition ? `What is the definition of ${word.term}` : `What is the term for ${word.definition}`}?\n`,
  );

  const answers = [
    showDefinition ? word.definition : word.term,
    ...wrongAnswers,
  ].sort(() => 0.5 - Math.random());

  answers.forEach((answer, index) => {
    process.stdout.write(`${index + 1}. ${answer}\n`);
  });

  // Get the user's answer
  let userAnswer: number;
  do {
    userAnswer =
      parseInt(prompt("Enter the number of the correct answer:\n") as string) -
      1;
    if (userAnswer < 0 || userAnswer > 3) {
      process.stdout.write(
        "Invalid input. Please enter a number between 1 and 4.",
      );
    }
  } while (userAnswer < 0 || userAnswer > 3);

  // Check if the user's answer is correct
  if (answers[userAnswer] === (showDefinition ? word.definition : word.term)) {
    process.stdout.write("Correct!\n");
    updateReviewLevels(word, true);
  } else {
    process.stdout.write(
      `Incorrect. The correct answer is: ${showDefinition ? word.term : word.definition}\n`,
    );
  }
}

// Calculate the next review time of a correct answer (If not correct next review time is 0 "so it will be asked again")
function calculateNextReviewTime(word: Word, indexOfReview: number): number {
  // Get the current review level of the word
  let currentReviewLevel = userData.currentReviewLevels[indexOfReview].score;

  const reviewTimes: { [key: number]: number } = {
    1: 3600, // 1 Hour
    2: 43200, // 12 Hours
    3: 432000, // 5 Days
    4: 1814400, // 21 Days
    5: 3888000, // 45 Days
    6: 20736000, // 240 days
    7: 31556926, // 1 Year
  };

  return Date.now() + reviewTimes[currentReviewLevel + 1] || 0;
}

function updateReviewLevels(word: Word, correct: boolean) {
  if (correct) {
    // Check if the word is in the current review levels
    let index = searchReviews(word.id);

    // If the word is not in the current review levels add it
    if (index == null) {
      userData.currentReviewLevels.push({
        id: word.id,
        nextReview: Date.now() + 3600,
        score: 1,
      });
    } else {
      userData.currentReviewLevels[index].nextReview = calculateNextReviewTime(
        word,
        index,
      );
      userData.currentReviewLevels[index].score++;
    }
  }
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

    generateQuestion(word);

    // Check if the user wants to continue if not save and close
    if (prompt("Do you want to continue? (y/n)\n") == "n") {
      saveUserData(userData);
      process.stdout.write("Bye bye!\n");
      process.exit();
    }
  }
}

main();

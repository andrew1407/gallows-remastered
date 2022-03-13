export const difficultyLevel = {
  DIFFICULT: 1,
  NORMAL: 2,
  EASY: 3,
  NO_CHALLANGE: 4,
};

export const triesCount = {
  DIFFICULT: 1,
  NORMAL: 7,
  EASY: 13,
  NO_CHALLANGE: 11819615,
};

export const defineStageHandlers = {
  DIFFICULT: () => 7,
  NORMAL: tries => 14 - tries,
  EASY: tries => 14 - tries,
  NO_CHALLANGE: () => 1,
};

export const findDifficulty = value => {
  for (const difficulty in difficultyLevel)
    if (difficultyLevel[difficulty] === value) return difficulty;
  return null;
};

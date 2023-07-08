const boxTemplate = (template, resource) => {
  return resource instanceof Promise ? resource.then(template) : template(resource);
};

const repeatValues = (values, repeatCount) => {
  const repeated = [];
  for (let i = 0; i < repeatCount; ++i) repeated.push(...values);
  return repeated;
};

const singleFrameTemplate = frame => [{ frames: [frame] }];

const titleTemplate = frames => ({
  frames,
  delays: [1000],
  before: 1500,
  repeat: 100,
});

const defaultLossTemplate = frames => ({
  frames,
  delays: [1000, 1500],
  after: 1000,
});

const difficultyModeTemplate = loaded => {
  const [ shouting, ...moves ] = loaded;
  const firstScene = {
    frames: [shouting],
    after: 1500,
  };
  const secondScene = {
    frames: moves,
    delays: [70],
  };
  return [firstScene, secondScene];
};

const defaultTemplate = boxTemplate.bind(null, ([d, t]) => [defaultLossTemplate(d), titleTemplate(t)]);
const difficultTemplate = boxTemplate.bind(null, ([d, t]) => [difficultyModeTemplate(d), titleTemplate(t)].flat());

export const difficulty = boxTemplate.bind(null, singleFrameTemplate);

export const prologue = boxTemplate.bind(null, loaded => {
  const [ initial, speech1, speech2, ...moves ] = loaded;
  const dialogueStages = [initial, ...repeatValues([speech1, speech2], 5)];
  return [
    { frames: dialogueStages, delays: [600] },
    { frames: moves, delays: [400], after: 1000 },
  ];
});

export const gameplay = boxTemplate.bind(null, singleFrameTemplate);

export const win = boxTemplate.bind(null, frames => [{
  frames,
  delays: [800],
  repeat: 100,
}]);

export const loss = Object.freeze({
  DIFFICULT: difficultTemplate,
  NORMAL: defaultTemplate,
  EASY: defaultTemplate,
  NO_CHALLANGE: boxTemplate.bind(null, singleFrameTemplate),
});

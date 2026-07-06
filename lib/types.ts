export type Topic = "space" | "physics" | "life" | "earth";

export const TOPICS: Topic[] = ["space", "physics", "life", "earth"];

export const TOPIC_LABEL: Record<Topic, string> = {
  space: "Space",
  physics: "Physics",
  life: "Life",
  earth: "Earth",
};

// Concrete hex values: usable directly on <canvas>, in inline styles, and as
// the `--accent` custom property. Keep in sync with the @theme tokens in
// app/globals.css.
export const TOPIC_ACCENT: Record<Topic, string> = {
  space: "#8b7cff",
  physics: "#4ec9d9",
  life: "#5ec98a",
  earth: "#e0a860",
};

export type WidgetName = "scaleZoom" | "moonDistance" | "gravityToy" | "deepTime";

export type WidgetParams = Record<string, number | string>;

export type CardBase = {
  id: string;
  topic: Topic;
  source?: string;
};

export type ConceptCard = CardBase & {
  type: "concept";
  hook: string;
  body: string;
};

export type InteractiveCard = CardBase & {
  type: "interactive";
  question: string;
  widget: WidgetName;
  params: WidgetParams;
};

export type RevealAnimation = "countUp" | "barGrow";

export type PredictCard = CardBase & {
  type: "predict";
  prompt: string;
  options: [string, string, string];
  correctIndex: 0 | 1 | 2;
  reveal: {
    widget?: WidgetName;
    params?: WidgetParams;
    animation?: RevealAnimation;
    value?: number;
    unit?: string;
  };
  kicker: string;
};

export type Card = ConceptCard | InteractiveCard | PredictCard;

export type Prediction = {
  cardId: string;
  chosenIndex: number;
  correct: boolean;
};

export type FeedState = {
  dateKey: string;
  lastCardIndex: number;
  predictions: Prediction[];
  daysVisited: number;
};

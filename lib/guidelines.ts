export const GUIDELINES = [
  {
    id: "front",
    title: "Front Face",
    description: "Look straight at the camera with a neutral expression.",
    imgSrc: "/guide/front.jpeg",
  },
  {
    id: "left45",
    title: "Left 45 Degree",
    description: "Turn your face slightly to the right to show your left side.",
    imgSrc: "/guide/left45.jpeg",
  },
  {
    id: "right45",
    title: "Right 45 Degree",
    description: "Turn your face slightly to the left to show your right side.",
    imgSrc: "/guide/right45.jpeg",
  },
  {
    id: "chinUp",
    title: "Chin Up",
    description: "Tilt your head up slightly to show your chin and neck.",
    imgSrc: "/guide/chin_up.jpeg",
  },
  {
    id: "chinDown",
    title: "Chin Down",
    description: "Tilt your head down slightly to show your forehead.",
    imgSrc: "/guide/chin_down.jpeg",
  },
  {
    id: "frontSmiling",
    title: "Front Smiling",
    description: "Look straight at the camera and give a smile.",
    imgSrc: "/guide/front_smiling.jpeg",
  },
] as const;

export type PoseId = typeof GUIDELINES[number]['id'];

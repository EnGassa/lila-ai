
import React from 'react';
import Image from 'next/image';

export type PoseId = 'front' | 'left45' | 'right45' | 'chinUp' | 'chinDown';

export interface GuidelineStep {
  id: PoseId;
  title: string;
  description: React.ReactNode;
  imgSrc: string;
  width: number;
  height: number;
}

export const GUIDELINES: GuidelineStep[] = [
  {
    id: 'front',
    title: 'Front Face',
    description: <><strong>Look straight at the camera</strong> with a neutral expression (mouth closed, not smiling). Click at eye level. Do not focus on a single part of the face so that the whole face is in focus.</>,
    imgSrc: '/guidelines/guideline-1.png',
    width: 1536,
    height: 2040,
  },
  {
    id: 'left45',
    title: 'Left 45 degree',
    description: <><strong>Turn your face slightly</strong> so that the camera sees your left side at a 45-degree angle. We want to see the cheek and jawline on that side clearly.</>,
    imgSrc: '/guidelines/guideline-2.png',
    width: 1536,
    height: 2040,
  },
  {
    id: 'right45',
    title: 'Right 45 degree',
    description: <>Same as above, but show the other side of your face. <strong>Turn the other way</strong> so the camera sees your right side at 45°.</>,
    imgSrc: '/guidelines/guideline-3.png',
    width: 1536,
    height: 2040,
  },
  {
    id: 'chinUp',
    title: 'Chin Up',
    description: <><strong>Face front and look up slightly</strong> to capture your chin and neck area.</>,
    imgSrc: '/guidelines/guideline-4.png',
    width: 1536,
    height: 2040,
  },
  {
    id: 'chinDown',
    title: 'Chin Down',
    description: <><strong>Look down and tuck your chin slightly.</strong> We want a clear image of your forehead from the top.</>,
    imgSrc: '/guidelines/guideline-5.png',
    width: 1536,
    height: 2040,
  },
];

export function PhotoGuidelines() {
  return (
    <div className="bg-white text-black p-6 font-sans">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-medium mb-6">How to Take Photos</h1>
        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <p className="text-base font-light">
            For best results, before clicking the photo make sure to:
          </p>
          <ul className="list-disc list-inside text-base font-light mt-4 space-y-2">
            <li><strong>Wash your face with a cleanser</strong>, remove any makeup and moisturizer</li>
            <li>Tie your hair back, keep face clean and dry</li>
            <li><strong>Preferably use your BACK camera for better quality images.</strong> If incase that is not possible, you can the front camera. </li>
            <li><strong>Click it indoors </strong> during the day using natural light</li>
            <li>Stand <strong>facing a window in daylight</strong></li>
            <li>Avoid direct <strong>harsh sunlight, glares or dark shadows</strong></li>
            <li>Disable any <strong>face retouching options or filters</strong> (usually turned off by default for the back camera)</li>
          </ul>
        </div>

        <h2 className="text-2xl font-medium mb-4">What Angles to Click</h2>
        <p className="text-base font-light mb-8">
          You need to click {GUIDELINES.length} photos. See examples and instructions below.
        </p>

        <div className="space-y-12">
          {GUIDELINES.map((guideline, index) => (
            <div key={guideline.id}>
              <h3 className="text-xl font-medium mb-4">{index + 1}. {guideline.title}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="w-full">
                  <Image
                    src={guideline.imgSrc}
                    alt={guideline.title}
                    layout="responsive"
                    width={guideline.width}
                    height={guideline.height}
                    className="rounded-lg"
                  />
                </div>
                <p className="text-base font-light">{guideline.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

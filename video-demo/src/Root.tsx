import React from 'react';
import { Composition } from 'remotion';
import { KhorakDemo } from './KhorakDemo';
import { TOTAL_FRAMES } from './types';

export const Root: React.FC = () => {
  return (
    <Composition
      id="KhorakDemo"
      component={KhorakDemo}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{}}
    />
  );
};

import React from 'react';
import { Sequence, Audio, staticFile } from 'remotion';
import { SCENE_DURATIONS } from './types';
import { Scene1Hook } from './scenes/Scene1Hook';
import { Scene2Intro } from './scenes/Scene2Intro';
import { Scene3Receipt } from './scenes/Scene3Receipt';
import { Scene4DistributionAadhaar } from './scenes/Scene4DistributionAadhaar';
import { Scene5Ledger } from './scenes/Scene5Ledger';
import { Scene6SpoilageHeatmap } from './scenes/Scene6SpoilageHeatmap';
import { Scene7OfflineMPR } from './scenes/Scene7OfflineMPR';
import { Scene8Closing } from './scenes/Scene8Closing';

export const KhorakDemo: React.FC = () => {
  const d = SCENE_DURATIONS;

  const s1Start = 0;
  const s2Start = s1Start + d.scene1;
  const s3Start = s2Start + d.scene2;
  const s4Start = s3Start + d.scene3;
  const s5Start = s4Start + d.scene4;
  const s6Start = s5Start + d.scene5;
  const s7Start = s6Start + d.scene6;
  const s8Start = s7Start + d.scene7;

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: '#FAF3E8',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* SCENE 1 — THE HOOK */}
      <Sequence from={s1Start} durationInFrames={d.scene1} name="Scene 1 - The Hook">
        <Audio src={staticFile('audio/scene-01.mp3')} volume={1} />
        <Scene1Hook />
      </Sequence>

      {/* SCENE 2 — PROBLEM STATEMENT & SOLUTIONS */}
      <Sequence from={s2Start} durationInFrames={d.scene2} name="Scene 2 - Problem Statement & Solutions">
        <Audio src={staticFile('audio/scene-02.mp3')} volume={1} />
        <Scene2Intro />
      </Sequence>

      {/* SCENE 3 — RECEIVING THE DELIVERY */}
      <Sequence from={s3Start} durationInFrames={d.scene3} name="Scene 3 - Receiving Delivery & Shortage">
        <Audio src={staticFile('audio/scene-03.mp3')} volume={1} />
        <Scene3Receipt />
      </Sequence>

      {/* SCENE 4 — AADHAAR SCANNING & CONTINUOUS LOOP DISTRIBUTION */}
      <Sequence from={s4Start} durationInFrames={d.scene4} name="Scene 4 - Aadhaar Scan & Distribution">
        <Audio src={staticFile('audio/scene-04.mp3')} volume={1} />
        <Scene4DistributionAadhaar />
      </Sequence>

      {/* SCENE 5 — LIVE RUNNING STOCK LEDGER */}
      <Sequence from={s5Start} durationInFrames={d.scene5} name="Scene 5 - Live Running Stock Ledger">
        <Audio src={staticFile('audio/scene-05.mp3')} volume={1} />
        <Scene5Ledger />
      </Sequence>

      {/* SCENE 6 — SPOILAGE CONTROL & SECTOR HEATMAP */}
      <Sequence from={s6Start} durationInFrames={d.scene6} name="Scene 6 - Spoilage & Sector Heatmap">
        <Audio src={staticFile('audio/scene-06.mp3')} volume={1} />
        <Scene6SpoilageHeatmap />
      </Sequence>

      {/* SCENE 7 — OFFLINE RESILIENCE & ONE-CLICK MPR */}
      <Sequence from={s7Start} durationInFrames={d.scene7} name="Scene 7 - Offline Sync & Form 6 MPR">
        <Audio src={staticFile('audio/scene-07.mp3')} volume={1} />
        <Scene7OfflineMPR />
      </Sequence>

      {/* SCENE 8 — EXPECTED OUTCOMES & CLOSING */}
      <Sequence from={s8Start} durationInFrames={d.scene8} name="Scene 8 - Expected Outcomes & Closing">
        <Audio src={staticFile('audio/scene-08.mp3')} volume={1} />
        <Scene8Closing />
      </Sequence>
    </div>
  );
};

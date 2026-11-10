import { Composition } from "remotion";
import { Lookbook } from "./Lookbook";
import { DURATION, FPS, HEIGHT, WIDTH } from "./data";

export const MyComposition = () => {
  return (
    <Composition
      id="Lookbook"
      component={Lookbook}
      durationInFrames={DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};

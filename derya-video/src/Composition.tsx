import { Composition } from "remotion";
import { Promo } from "./Promo";
import { DURATION, FPS, HEIGHT, WIDTH } from "./data";

export const MyComposition = () => {
  return (
    <Composition
      id="DeryaPromo"
      component={Promo}
      durationInFrames={DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};

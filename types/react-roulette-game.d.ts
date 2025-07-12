declare module 'react-roulette-game' {
  import { FC } from 'react';

  interface RouletteProps {
    roulette_img_under_highlight: string;
    roulette_img_on_highlight: string;
    highlight_img: string;
    pointer_img: string;
    prize_arr: string[];
    on_complete: (prizeKey: string) => void;
    has_reset?: boolean;
    start_text?: string;
  }

  const Roulette: FC<RouletteProps>;
  export default Roulette;
}

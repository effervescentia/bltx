import { createRainbowSprinkles, defineProperties } from 'rainbow-sprinkles';
import { themeContract } from '../../styles/theme.css';

const responsiveProperties = defineProperties({
  dynamicProperties: {
    margin: themeContract.space,
    marginTop: themeContract.space,
    marginLeft: themeContract.space,
    marginRight: themeContract.space,
    marginBottom: themeContract.space,

    display: true,
    textAlign: true,
    flexDirection: true,
    justifyContent: true,
    alignItems: true,
  },
  staticProperties: {
    display: ['block', 'flex', 'inline-block', 'inline-flex'],
  },
  shorthands: {
    m: ['margin'],
    mr: ['marginRight'],
    ml: ['marginLeft'],
    mt: ['marginTop'],
    mb: ['marginBottom'],
    mx: ['marginLeft', 'marginRight'],
    my: ['marginTop', 'marginBottom'],
  },
});

export const sprinkles = createRainbowSprinkles(responsiveProperties);

export type Sprinkles = Parameters<typeof sprinkles>[0];

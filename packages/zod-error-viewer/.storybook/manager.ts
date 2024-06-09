import { addons } from "@storybook/manager-api";
import { create } from "@storybook/theming/create";

// @ts-expect-error
import logo from "../img/logo-wide.png";

const theme = create({
  base: "light",
  brandTitle: "zod-error-viewer",
  brandImage: logo,
});

addons.setConfig({
  theme,
});

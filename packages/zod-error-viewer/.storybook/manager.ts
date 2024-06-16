import { addons } from "@storybook/manager-api";
import { create } from "@storybook/theming/create";

const theme = create({
  base: "light",
  brandTitle: "zod-error-viewer",
});

addons.setConfig({
  theme,
});

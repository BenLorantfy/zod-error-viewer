import type { Meta, StoryObj } from "@storybook/react";
// import { fn } from '@storybook/test';
import { ZodErrorViewer } from "./ZodErrorViewer";
import { z } from "zod";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: "ZodErrorViewer",
  component: ZodErrorViewer,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["autodocs"],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    // backgroundColor: { control: 'color' },
  },
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: {
    // onClick: fn()
  },
} satisfies Meta<typeof ZodErrorViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
const basicData = {
  person: {
    name: "Han Solo",
    age: "35",
    shotFirst: false,
  },
};

export const Basic: Story = {
  args: {
    data: basicData,
    error: z
      .object({
        person: z.object({
          name: z.string(),
          age: z.number(),
          shotFirst: z.literal(true),
        }),
      })
      .safeParse(basicData).error!,
  },
};

const unionsData = {
  person: {
    name: "Han Solo",
    age: "35",
  },
};
export const Unions: Story = {
  args: {
    data: unionsData,
    error: z
      .union([
        z.string(),
        z.object({
          person: z.object({
            name: z.string(),
            age: z.number(),
          }),
        }),
      ])
      .safeParse(unionsData).error!,
  },
};

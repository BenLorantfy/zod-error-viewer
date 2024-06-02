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

const nestedUnionsData = {
  person: {
    name: "Han Solo",
    age: 35,
    sideKicks: [
      {
        name: "R2-D2",
      },
    ],
  },
};
export const NestedUnions: Story = {
  args: {
    data: nestedUnionsData,
    error: z
      .union([
        z.string(),
        z.object({
          person: z.object({
            name: z.string(),
            age: z.number(),
            sideKicks: z.array(
              z.union([
                z.object({
                  name: z.literal("Chewbacca"),
                }),
                z.object({
                  name: z.literal("Lando Calrissian"),
                }),
              ]),
            ),
          }),
        }),
      ])
      .safeParse(nestedUnionsData).error!,
  },
};

const missingKeysData = {
  person: {
    name: "Han Solo",
  },
};
export const MissingKeys: Story = {
  args: {
    data: missingKeysData,
    error: z
      .object({
        person: z.object({
          name: z.string(),
          height: z.number(),
          age: z.number(),
        }),
      })
      .safeParse(missingKeysData).error!,
  },
};

const unrecongizedKeysData = {
  person: {
    name: "Han Solo",
    age: 45,
  },
};
export const UnreconginzedKeys: Story = {
  args: {
    data: unrecongizedKeysData,
    error: z
      .object({ person: z.object({ name: z.string() }).strict() })
      .safeParse(unrecongizedKeysData).error!,
  },
};

const invalidEnumValue = {
  person: {
    name: "Han Solo",
    hairColor: "blue",
  },
};

export const InvalidEnumValue: Story = {
  args: {
    data: invalidEnumValue,
    error: z
      .object({
        person: z.object({
          name: z.string(),
          hairColor: z.enum(["brown", "black"]),
        }),
      })
      .safeParse(invalidEnumValue).error!,
  },
};

const invalidDateValue = {
  person: {
    name: "Han Solo",
    birthDate: "2024-70-70",
  },
};
export const InvalidDateValue: Story = {
  args: {
    data: invalidDateValue,
    error: z
      .object({
        person: z.object({
          name: z.string(),
          birthDate: z.date(),
        }),
      })
      .safeParse(invalidDateValue).error!,
  },
};

const invalidStringValue = {
  person: {
    name: "Han Solo",
    email: "aaaa",
    website: "http://",
  },
};
export const InvalidStringValue: Story = {
  args: {
    data: invalidStringValue,
    error: z
      .object({
        person: z.object({
          name: z.string(),
          email: z.string().email(),
          website: z.string().url(),
        }),
      })
      .safeParse(invalidStringValue).error!,
  },
};

const sizeErrorsData = {
  arr1: [1, 2, 3],
  arr2: [],
};

export const SizeErrors: Story = {
  args: {
    data: sizeErrorsData,
    error: z
      .object({
        arr1: z.array(z.number()).max(2),
        arr2: z.array(z.number()).min(1),
      })
      .safeParse(sizeErrorsData).error!,
  },
};

const notMultipleOfErr = {
  num: 7,
};
export const NotMultipleOfError: Story = {
  args: {
    data: notMultipleOfErr,
    error: z
      .object({ num: z.number().multipleOf(5) })
      .safeParse(notMultipleOfErr).error!,
  },
};

const customError = {
  background: {
    image: "https://example.com/image.jpg",
    color: "blue",
  },
};

export const CustomError: Story = {
  args: {
    data: customError,
    error: z
      .object({
        background: z
          .object({
            image: z.string().optional(),
            color: z.string().optional(),
          })
          .refine(
            (data) => {
              return !(data.image && data.color);
            },
            {
              message: "Only one of image or color can be provided",
            },
          ),
      })
      .safeParse(customError).error!,
  },
};

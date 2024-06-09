import "./playground.css";
import type { Meta, StoryObj } from "@storybook/react";
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

/**
 * An example showing how union errors are displayed.  Each union entry will
 * have its own error.  The user can switch between union entry errors by using
 * prev / next buttons.
 */
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
        name: "Zeb Orrelios",
      },
    ],
  },
};

/**
 * A more complicated example showing nested unions and multiple prev / next
 * buttons
 */
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

/**
 * An example showing how missing keys are displayed
 */
// TODO: add test for missing key that is a union
export const MissingKeys: Story = {
  args: {
    data: missingKeysData,
    error: z
      .object({
        person: z.object({
          name: z.string(),
          height: z.number(),
          age: z.number(),
          sideKick: z.literal("Chewbacca"),
          hairColor: z.union([z.literal("brown"), z.literal("black")]),
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

/**
 * An example showing how unrecognized keys are displayed
 */
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

/**
 * An example showing how invalid enum values are displayed
 */
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

/**
 * An example showing how invalid date values are displayed
 */
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

/**
 * An example showing how invalid string values are displayed
 */
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

/**
 * An example showing how size errors are displayed
 */
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

/**
 * An example showing how not multiple of errors are displayed
 */
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

/**
 * An example showing how custom errors are displayed
 */
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

const truncatedArrayData = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  0,
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
];
export const TruncatedArray: Story = {
  args: {
    data: truncatedArrayData,
    error: z.array(z.string()).safeParse(truncatedArrayData).error!,
  },
};

const endTruncatedArrayData = [
  "a",
  "b",
  "c",
  0,
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
];
export const EndTruncatedArray: Story = {
  args: {
    data: endTruncatedArrayData,
    error: z.array(z.string()).safeParse(endTruncatedArrayData).error!,
  },
};

const startTruncatedArrayData = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  0,
  "p",
  "q",
  "r",
];
export const StartTruncatedArray: Story = {
  args: {
    data: startTruncatedArrayData,
    error: z.array(z.string()).safeParse(startTruncatedArrayData).error!,
  },
};

export const NestedTruncatedArray: Story = {
  args: {
    data: { arr: truncatedArrayData },
    error: z
      .object({ arr: z.string().array() })
      .safeParse({ arr: truncatedArrayData }).error!,
  },
};

const customThemeData = {
  myObject: {
    myStr: "hello",
    myNum: 42,
    myBool: true,
    myNull: null,
    myArr: ["aaa", 42, true, null, 1, 2, 3, 4, 5, 6, 7, 8],
  },
};

/**
 * An example showing how you can pass a custom theme to the component
 */
export const CustomTheme: Story = {
  args: {
    data: customThemeData,
    error: z
      .object({
        myObject: z.object({
          myStr: z.string().max(2),
          myNum: z.number(),
          myBool: z.boolean(),
          myNull: z.null(),
          myArr: z.array(z.union([z.string(), z.number(), z.boolean()])),
        }),
      })
      .safeParse(customThemeData).error!,
    theme: {
      background: "#1e1e1e",
      key: "#a3d2f0",
      errorBackground: "#30201e",
      number: "#bacdab",
      boolean: "#679ad1",
      null: "#679ad1",
      undefined: "#679ad1",
      string: "#c5947c",
      errorForeground: "#F27878",
      bracket: "#b09a3b",
      colon: "#a3d2f0",
      comma: "#d4d4d4",
      lineNumberBackground: "#141414",
      lineNumber: "#848484",
      truncationBackground: "#4b4b4b",
      truncation: "#d3d3d3",
    },
  },
};

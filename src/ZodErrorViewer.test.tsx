// @vitest-environment happy-dom

import { test, expect, beforeEach } from "vitest";
import Meta, * as stories from "./ZodErrorViewer.stories";
import { composeStories } from "@storybook/react";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { z } from "zod";

const {
  Basic,
  Unions,
  NestedUnions,
  MissingKeys,
  UnreconginzedKeys,
  InvalidEnumValue,
  InvalidDateValue,
  InvalidStringValue,
  SizeErrors,
  NotMultipleOfError,
  CustomError,
  CustomTheme,
} = composeStories(stories, Meta);

beforeEach(cleanup);

// @ts-expect-error Workaround for this bug: https://github.com/capricorn86/happy-dom/issues/1151#issue-1970014506
SVGElement.prototype.innerText = "";

test("renders correctly for basic example", () => {
  render(<Basic />);
  expect(`\n${document.body.innerText}\n`).toMatchInlineSnapshot(`
    "
    1{
    2	"person": {
    3		"name": "Han Solo",
    4		"age": "35", // Error: Expected number, received string
    5		"shotFirst": false // Error: Invalid literal value, expected true
    6	}
    7}
    "
  `);
});

test("renders correctly for unions", async () => {
  render(<Unions />);
  expect(`\n${document.body.innerText}\n`).toMatchInlineSnapshot(`
    "
    1{ // Error: Invalid union entry 1/2 : Expected string, received object
    2	"person": {
    3		"name": "Han Solo",
    4		"age": "35"
    5	}
    6}
    "
  `);

  userEvent.click(screen.getByRole("button", { name: "Next union error" }));
  await screen.findByText("2/2");

  expect(`\n${document.body.innerText}\n`).toMatchInlineSnapshot(`
    "
    1{ // Error: Invalid union entry 2/2 : 
    2	"person": {
    3		"name": "Han Solo",
    4		"age": "35" // Error: Expected number, received string
    5	}
    6}
    "
  `);
});

test("renders correctly for unions when no entry has a root level error", async () => {
  const data = {
    person: {
      name: "Han Solo",
      age: true,
    },
  };

  const error = z
    .object({
      person: z.union([
        z.object({
          name: z.string(),
          age: z.number(),
        }),
        z.object({
          name: z.string(),
          age: z.string(),
        }),
      ]),
    })
    .safeParse(data).error!;

  render(<Unions data={data} error={error} />);

  expect(`\n${document.body.innerText}\n`).toMatchInlineSnapshot(`
    "
    1{
    2	"person": { // Error: Invalid union entry 1/2 : 
    3		"name": "Han Solo",
    4		"age": true // Error: Expected number, received boolean
    5	}
    6}
    "
  `);

  expect(
    screen
      .getByRole("button", { name: "Previous union error" })
      .getAttribute("aria-disabled"),
  ).toBe("true");

  userEvent.click(screen.getByRole("button", { name: "Previous union error" }));
  expect(screen.getByText("1/2")).toBeDefined();

  userEvent.click(screen.getByRole("button", { name: "Next union error" }));
  await screen.findByText("2/2");

  expect(
    screen
      .getByRole("button", { name: "Next union error" })
      .getAttribute("aria-disabled"),
  ).toBe("true");
  userEvent.click(screen.getByRole("button", { name: "Next union error" }));
  expect(screen.getByText("2/2")).toBeDefined();

  expect(`\n${document.body.innerText}\n`).toMatchInlineSnapshot(`
    "
    1{
    2	"person": { // Error: Invalid union entry 2/2 : 
    3		"name": "Han Solo",
    4		"age": true // Error: Expected string, received boolean
    5	}
    6}
    "
  `);
});

test("renders correctly for nested unions", async () => {
  render(<NestedUnions />);
  expect(`\n${document.body.innerText}\n`).toMatchInlineSnapshot(`
    "
    1{ // Error: Invalid union entry 1/2 : Expected string, received object
    2	"person": {
    3		"name": "Han Solo",
    4		"age": 35,
    5		"sideKicks": [
    6			{
    7				"name": "R2-D2"
    8			}
    9		]
    10	}
    11}
    "
  `);

  userEvent.click(screen.getByRole("button", { name: "Next union error" }));
  await screen.findByText("2/2");
  expect(`\n${document.body.innerText}\n`).toMatchInlineSnapshot(`
    "
    1{ // Error: Invalid union entry 2/2 : 
    2	"person": {
    3		"name": "Han Solo",
    4		"age": 35,
    5		"sideKicks": [
    6			{ // Error: Invalid union entry 1/2 : 
    7				"name": "R2-D2" // Error: Invalid literal value, expected "Chewbacca"
    8			}
    9		]
    10	}
    11}
    "
  `);

  userEvent.click(
    screen.getAllByRole("button", { name: "Next union error" })[1]!,
  );
  await waitFor(() => expect(screen.getAllByText("2/2")).toHaveLength(2));

  expect(`\n${document.body.innerText}\n`).toMatchInlineSnapshot(`
    "
    1{ // Error: Invalid union entry 2/2 : 
    2	"person": {
    3		"name": "Han Solo",
    4		"age": 35,
    5		"sideKicks": [
    6			{ // Error: Invalid union entry 2/2 : 
    7				"name": "R2-D2" // Error: Invalid literal value, expected "Lando Calrissian"
    8			}
    9		]
    10	}
    11}
    "
  `);
});

test("renders correctly for missing keys", () => {
  render(<MissingKeys />);

  expect(`\n${document.body.innerText}\n`).toMatchInlineSnapshot(`
    "
    1{
    2	"person": {
    3		"name": "Han Solo"
    4	} // Error: Object missing required keys: 'height', 'age'
    5}
    "
  `);
});

test("renders correctly for unreconizged keys", () => {
  render(<UnreconginzedKeys />);
  expect(`\n${document.body.innerText}\n`).toMatchInlineSnapshot(`
    "
    1{
    2	"person": { // Error: Unrecognized key(s) in object: 'age'
    3		"name": "Han Solo",
    4		"age": 45
    5	}
    6}
    "
  `);
});

test("renders invalid enum error correctly", () => {
  render(<InvalidEnumValue />);

  expect(`\n${document.body.innerText}\n`).toMatchInlineSnapshot(`
    "
    1{
    2	"person": {
    3		"name": "Han Solo",
    4		"hairColor": "blue" // Error: Invalid enum value. Expected 'brown' | 'black', received 'blue'
    5	}
    6}
    "
  `);
});

test("renders invalid data error correctly", () => {
  render(<InvalidDateValue />);

  expect(`\n${document.body.innerText}\n`).toMatchInlineSnapshot(`
    "
    1{
    2	"person": {
    3		"name": "Han Solo",
    4		"birthDate": "2024-70-70" // Error: Expected date, received string
    5	}
    6}
    "
  `);
});

test("renders invalid string error correctly", () => {
  render(<InvalidStringValue />);
  expect(`\n${document.body.innerText}\n`).toMatchInlineSnapshot(`
    "
    1{
    2	"person": {
    3		"name": "Han Solo",
    4		"email": "aaaa", // Error: Invalid email
    5		"website": "http://" // Error: Invalid url
    6	}
    7}
    "
  `);
});

test("renders invalid size errors correctly", () => {
  render(<SizeErrors />);
  expect(`\n${document.body.innerText}\n`).toMatchInlineSnapshot(`
    "
    1{
    2	"arr1": [ // Error: Array must contain at most 2 element(s)
    3		1,
    4		2,
    5		3
    6	],
    7	"arr2": [ // Error: Array must contain at least 1 element(s)
    8	]
    9}
    "
  `);
});

test("renders invalid multipleOf errors correctly", () => {
  render(<NotMultipleOfError />);
  expect(`\n${document.body.innerText}\n`).toMatchInlineSnapshot(`
    "
    1{
    2	"num": 7 // Error: Number must be a multiple of 5
    3}
    "
  `);
});

test("renders custom error message correctly", () => {
  render(<CustomError />);
  expect(`\n${document.body.innerText}\n`).toMatchInlineSnapshot(`
    "
    1{
    2	"background": { // Error: Only one of image or color can be provided
    3		"image": "https://example.com/image.jpg",
    4		"color": "blue"
    5	}
    6}
    "
  `);
});

test("allows passing a custom theme without errors", () => {
  expect(() => render(<CustomTheme />)).not.toThrow();
});

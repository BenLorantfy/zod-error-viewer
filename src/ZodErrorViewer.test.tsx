// @vitest-environment happy-dom

import { test, expect, beforeEach } from "vitest";
import Meta, * as stories from "./ZodErrorViewer.stories";
import { composeStories } from "@storybook/react";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { z } from "zod";

const { Basic, Unions } = composeStories(stories, Meta);

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

test("renders correctly for unions", async () => {
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

  userEvent.click(screen.getByRole("button", { name: "Next union error" }));
  await screen.findByText("2/2");

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

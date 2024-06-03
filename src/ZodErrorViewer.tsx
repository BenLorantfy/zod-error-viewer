"use client";

import { type CSSProperties, useState, useMemo } from "react";
import { z, ZodError, ZodIssueCode } from "zod";

const defaultTheme = {
  lineNumber: "black",
  lineNumberBackground: "#f0f0f0",
  string: "#95261f",
  number: "#3c845c",
  boolean: "#0e0ef6",
  null: "#0e0ef6",
  undefined: "#0e0ef6",
  key: "#22509f",
  errorBackground: "#FFF0F0",
  errorForeground: "#C71A1A",
  background: "#FFFFFF",
  bracket: "#1330f0",
  colon: "#22509f",
  comma: "black",
};

const buttonStyle = (theme: typeof defaultTheme): CSSProperties => ({
  appearance: "none",
  backgroundColor: theme.errorForeground,
  color: theme.background,
  border: "none",
  fontSize: "0.75rem",
  cursor: "pointer",
  padding: "2px",
  paddingLeft: "6px",
  paddingRight: "6px",
  userSelect: "none",
});

const srOnly: CSSProperties = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: "0",
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
  border: "0",
};

/**
 * Renders a component that displays a Zod error and the parsed data that caused the error.
 */
export function ZodErrorViewer({
  data,
  error,
  theme = defaultTheme,
}: {
  /**
   * The data that was parsed when the error occurred
   */
  data: unknown;
  /**
   * The zod error that was thrown when parsing the data
   */
  error: z.ZodError;
  /**
   * A custom theme to apply to the component
   */
  theme?: Partial<typeof defaultTheme>;
}) {
  const mergedTheme = {
    ...defaultTheme,
    ...theme,
  };

  const countLines = useMemo(() => createMemoizedCountLines(), [data]);

  return (
    <div
      style={{
        fontSize: "1rem",
        whiteSpace: "nowrap",
        background: mergedTheme.background,
      }}
    >
      <RecursiveViewer
        data={data}
        error={error}
        path={[]}
        theme={mergedTheme}
        countLines={countLines}
      />
    </div>
  );
}

function RecursiveViewer({
  propertyKey,
  data,
  error,
  comma,
  indentation = 0,
  lineNum = 1,
  path,
  theme,
  countLines,
}: {
  propertyKey?: string;
  data: unknown;
  error: z.ZodError;
  comma?: boolean;
  indentation?: number;
  lineNum?: number;
  path: Array<string | number>;
  theme: typeof defaultTheme;
  countLines: (data: unknown) => number;
}) {
  const [unionErrorIndex, setSelectedUnionErrorIndex] = useState(0);

  const unionError = getUnionError({
    error,
    path,
    index: unionErrorIndex,
  });

  if (typeof data !== "object" || data === null) {
    return (
      <Line
        num={lineNum}
        value={data}
        propertyKey={propertyKey}
        comma={comma}
        indentation={indentation}
        path={path}
        error={error}
        onSelectUnionErrorIndex={setSelectedUnionErrorIndex}
        unionErrorIndex={unionErrorIndex}
        theme={theme}
      />
    );
  }

  let runningLineNum = lineNum;
  if (Array.isArray(data)) {
    return (
      <>
        <Line
          num={lineNum}
          propertyKey={propertyKey}
          bracket="["
          indentation={indentation}
          path={path}
          error={error}
          onSelectUnionErrorIndex={setSelectedUnionErrorIndex}
          unionErrorIndex={unionErrorIndex}
          theme={theme}
        />
        {data.map((value, i) => {
          runningLineNum += i === 0 ? 1 : countLines(data[i - 1]);
          return (
            <RecursiveViewer
              key={i}
              data={value}
              error={unionError || error}
              comma={i !== data.length - 1}
              indentation={indentation + 1}
              lineNum={runningLineNum}
              path={[...path, i]}
              theme={theme}
              countLines={countLines}
            />
          );
        })}
        <Line
          bracket="]"
          indentation={indentation}
          comma={comma}
          num={
            runningLineNum +
            (data.length === 0 ? 1 : countLines(data[data.length - 1]))
          }
          theme={theme}
        />
      </>
    );
  }

  const entries = Object.entries(data);
  return (
    <>
      <Line
        num={lineNum}
        propertyKey={propertyKey}
        bracket="{"
        indentation={indentation}
        path={path}
        error={error}
        onSelectUnionErrorIndex={setSelectedUnionErrorIndex}
        unionErrorIndex={unionErrorIndex}
        theme={theme}
      />
      {entries.map(([key, value], i) => {
        runningLineNum += i === 0 ? 1 : countLines(entries[i - 1]?.[1]);
        return (
          <RecursiveViewer
            key={key}
            propertyKey={key}
            data={value}
            error={unionError || error}
            comma={i !== entries.length - 1}
            indentation={indentation + 1}
            lineNum={runningLineNum}
            path={[...path, key]}
            theme={theme}
            countLines={countLines}
          />
        );
      })}
      <Line
        num={
          runningLineNum +
          (entries.length === 0
            ? 1
            : countLines(entries[entries.length - 1]?.[1]))
        }
        bracket="}"
        indentation={indentation}
        comma={comma}
        path={path}
        error={getMissingKeysError(error, path)}
        theme={theme}
      />
    </>
  );
}

/**
 * Constructs a custom error that mentions which keys are missing in an object
 */
function getMissingKeysError(error: ZodError, objPath: Array<string | number>) {
  const missingKeyIssues = error.issues.filter((issue) => {
    return (
      issue.code === ZodIssueCode.invalid_type &&
      issue.received === "undefined" &&
      issue.message === "Required" &&
      issue.path.slice(0, issue.path.length - 1).join(".") === objPath.join(".")
    );
  });

  if (missingKeyIssues.length > 0) {
    const keys = missingKeyIssues.map(
      (issue) => issue.path[issue.path.length - 1],
    );
    return new ZodError([
      {
        code: ZodIssueCode.custom,
        path: objPath,
        message:
          keys.length === 1
            ? `Object missing required key: ${keys[0]}`
            : `Object missing required keys: ${keys.map((key) => `'${key}'`).join(", ")}`,
      },
    ]);
  }

  return undefined;
}

/**
 * Gets the union error at a specific index
 */
function getUnionError({
  error,
  path,
  index,
}: {
  error?: ZodError;
  path?: Array<string | number>;
  index: number;
}) {
  const issues =
    error?.issues.filter((issue) => issue.path.join(".") === path?.join(".")) ||
    [];
  const issue = issues[0];
  return issue?.code === ZodIssueCode.invalid_union
    ? issue?.unionErrors[index]
    : undefined;
}

function Line({
  num,
  value,
  propertyKey,
  bracket,
  error,
  indentation = 0,
  comma,
  path,
  unionErrorIndex = 0,
  onSelectUnionErrorIndex,
  theme,
}: {
  num: number;
  value?: unknown;
  propertyKey?: unknown;
  bracket?: string;
  error?: ZodError;
  indentation?: number;
  comma?: boolean;
  path?: Array<string | number>;
  unionErrorIndex?: number;
  onSelectUnionErrorIndex?: (err: number) => void;
  theme: typeof defaultTheme;
}) {
  const issues =
    error?.issues.filter((issue) => issue.path.join(".") === path?.join(".")) ||
    [];
  const issue = issues[0];
  const unionError = getUnionError({
    error,
    path,
    index: unionErrorIndex,
  });

  return (
    <div
      style={{
        backgroundColor: issues.length > 0 ? theme.errorBackground : undefined,
      }}
    >
      <div
        style={{
          padding: "4px",
          paddingRight: "8px",
          backgroundColor: theme.lineNumberBackground,
          width: "40px",
          display: "inline-block",
          textAlign: "right",
          fontFamily: "monospace",
          userSelect: "none",
          color: theme.lineNumber,
        }}
      >
        {num}
      </div>
      <pre
        style={{
          display: "inline-block",
          paddingLeft: "8px",
          paddingRight: "16px",
          fontFamily: "monospace",
          tabSize: "24px",
          margin: 0,
        }}
      >
        {/* INDENTATION */}
        {Array(indentation).fill("\t").join("")}

        {/* KEY */}
        {!!propertyKey && (
          <span style={{ color: theme.key }}>{`"${propertyKey}"`}</span>
        )}
        {!!propertyKey && <span style={{ color: theme.colon }}>: </span>}

        {/* VALUE */}
        {typeof value === "string" && (
          <span style={{ color: theme.string }}>{`"${value}"`}</span>
        )}
        {typeof value === "number" && (
          <span style={{ color: theme.number }}>{value}</span>
        )}
        {typeof value === "boolean" && value && (
          <span style={{ color: theme.boolean }}>true</span>
        )}
        {typeof value === "boolean" && !value && (
          <span style={{ color: theme.boolean }}>false</span>
        )}
        {value === null && <span style={{ color: theme.null }}>null</span>}

        {/* BRACKET */}
        {bracket && <span style={{ color: theme.bracket }}>{bracket}</span>}

        {/* COMMA */}
        {comma && <span style={{ color: theme.comma }}>,</span>}

        {issue && (
          <span style={{ color: theme.errorForeground }}>
            <ErrorIcon />
            <span style={srOnly}> // Error: </span>
            <span>
              {issue.code === ZodIssueCode.invalid_union
                ? "Invalid union entry"
                : issue.message}
            </span>
            <span>
              {issue.code === ZodIssueCode.invalid_union && (
                <>
                  <ErrorSwitcher
                    index={unionErrorIndex}
                    max={issue.unionErrors.length}
                    theme={theme}
                    onPrev={() =>
                      onSelectUnionErrorIndex?.(unionErrorIndex - 1)
                    }
                    onNext={() =>
                      onSelectUnionErrorIndex?.(unionErrorIndex + 1)
                    }
                  />
                  {`: `}
                  {
                    unionError?.issues.find(
                      (issue) => issue.path.join(".") === path?.join("."),
                    )?.message
                  }
                </>
              )}
            </span>
          </span>
        )}
      </pre>
    </div>
  );
}

function ErrorSwitcher({
  index,
  max,
  onPrev,
  onNext,
  theme,
}: {
  index: number;
  max: number;
  onPrev: () => void;
  onNext: () => void;
  theme: typeof defaultTheme;
}) {
  return (
    <>
      {` `}
      <div
        style={{
          display: "inline-block",
          border: `1px solid ${theme.errorForeground}`,
          borderRadius: "4px",
          fontSize: "0.85rem",
          backgroundColor: theme.background,
        }}
      >
        <span
          style={{ padding: "2px", paddingLeft: "8px", paddingRight: "8px" }}
        >
          {index + 1}/{max}
        </span>
        <button
          type="button"
          onClick={index !== 0 ? onPrev : undefined}
          style={{
            ...buttonStyle(theme),
            borderRight: `1px solid ${theme.background}`,
            cursor: index === 0 ? "auto" : "pointer",
          }}
          aria-label="Previous union error"
          aria-disabled={index === 0}
        >
          <ChevronLeftIcon />
        </button>
        <button
          type="button"
          onClick={index !== max - 1 ? onNext : undefined}
          style={{
            ...buttonStyle(theme),
            cursor: index === max - 1 ? "auto" : "pointer",
          }}
          aria-label="Next union error"
          aria-disabled={index === max - 1}
        >
          <ChevronRightIcon />
        </button>
      </div>
      {` `}
    </>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      aria-hidden
      style={{ position: "relative", top: "1px" }}
      xmlns="http://www.w3.org/2000/svg"
      height="14px"
      viewBox="0 -960 960 960"
      width="14px"
      fill="currentColor"
    >
      <path d="M560-240 320-480l240-240 56 56-184 184 184 184-56 56Z" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      aria-hidden
      style={{ position: "relative", top: "1px" }}
      xmlns="http://www.w3.org/2000/svg"
      height="14px"
      viewBox="0 -960 960 960"
      width="14px"
      fill="currentColor"
    >
      <path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      aria-hidden
      style={{
        marginLeft: "16px",
        marginRight: "6px",
        display: "inline",
        position: "relative",
        top: "3px",
        userSelect: "none",
      }}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 20 20"
    >
      <path
        fill="currentColor"
        d="M13.728 1H6.272L1 6.272v7.456L6.272 19h7.456L19 13.728V6.272zM11 15H9v-2h2zm0-4H9V5h2z"
      />
    </svg>
  );
}

function createMemoizedCountLines() {
  const cache = new Map<unknown, number>();

  function countLines(data: unknown): number {
    if (cache.has(data)) {
      return cache.get(data)!;
    }

    if (typeof data !== "object" || data === null) {
      const result = 1;
      cache.set(data, result);
      return result;
    }

    if (Array.isArray(data)) {
      const result = 2 + data.reduce((acc, curr) => acc + countLines(curr), 0);
      cache.set(data, result);
      return result;
    }

    const result =
      2 +
      Object.entries(data).reduce(
        (acc, [, value]) => acc + countLines(value),
        0,
      );
    cache.set(data, result);
    return result;
  }

  return countLines;
}

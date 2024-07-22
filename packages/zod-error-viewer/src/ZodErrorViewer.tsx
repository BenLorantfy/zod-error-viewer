"use client";

import * as React from "react";
import { type CSSProperties, useState, useMemo, useRef } from "react";
import { flushSync } from "react-dom";
import { z, ZodError, ZodIssue, ZodIssueCode } from "zod";

const defaultTheme = {
  fontSize: "1rem",
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
  truncation: "#616161",
  truncationBackground: "#edf2ff",
  newline: "#da2f20",
};

const buttonStyle = (theme: typeof defaultTheme): CSSProperties => ({
  appearance: "none",
  backgroundColor: theme.errorForeground,
  color: theme.background,
  border: "none",
  fontSize: "0.75em",
  cursor: "pointer",
  userSelect: "none",
  verticalAlign: "middle",
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
  error = new ZodError([]),
  theme = defaultTheme,
  height,
}: {
  /**
   * The data that was parsed when the error occurred
   */
  data: unknown;
  /**
   * The zod error that was thrown when parsing the data
   */
  error?: z.ZodError;
  /**
   * A custom theme to apply to the component
   */
  theme?: Partial<typeof defaultTheme>;

  /**
   * Set to `fill` to fill the parent container
   */
  height?: "fill";
}) {
  const mergedTheme = {
    ...defaultTheme,
    ...theme,
  };

  const countLines = useMemo(() => createMemoizedCountLines(data), [data]);

  return (
    <div
      style={{
        fontSize: mergedTheme.fontSize,
        whiteSpace: "nowrap",
        background: mergedTheme.background,
        position: "relative",
        height: height === "fill" ? "100%" : undefined,
        width: "100%",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          height: height === "fill" ? "100%" : 0,
          width: "3.25em",
          backgroundColor: mergedTheme.lineNumberBackground,
        }}
      ></div>
      <div
        style={{
          position: "relative",
          height: height === "fill" ? "100%" : undefined,
          overflow: "auto",
          width: "100%",
          lineHeight: 0,
        }}
      >
        <div style={{ width: "max-content", minWidth: "100%" }}>
          <RecursiveViewer
            data={data}
            error={error}
            path={[]}
            theme={mergedTheme}
            countLines={countLines}
            rootData={data}
          />
        </div>
      </div>
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
  onToggleTruncate,
  toggleButtonRef,
  truncated,
  rootData,
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
  onToggleTruncate?: () => void;
  toggleButtonRef?: React.RefObject<HTMLButtonElement>;
  truncated?: boolean;
  rootData?: unknown;
}) {
  const [unionErrorIndex, setSelectedUnionErrorIndex] = useState(0);
  const [truncateStart, setTruncateStart] = useState(true);
  const [truncateEnd, setTruncateEnd] = useState(true);

  const startToggleButtonRef = useRef<HTMLButtonElement>(null);
  const endToggleButtonRef = useRef<HTMLButtonElement>(null);

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
        onToggleTruncate={onToggleTruncate}
        toggleButtonRef={toggleButtonRef}
        truncated={truncated}
        rootData={rootData}
      />
    );
  }

  let runningLineNum = lineNum;
  if (Array.isArray(data)) {
    const firstInvalidItemIndex = data.findIndex((_, idx) => {
      const itemPath = [...path, idx];
      return error.issues.some(
        (issue) =>
          issue.path.slice(0, itemPath.length).join(".") === itemPath.join("."),
      );
    });

    const lastInvalidItemIndex = findLastIndex(data, (_, idx) => {
      const itemPath = [...path, idx];
      return error.issues.some(
        (issue) =>
          issue.path.slice(0, itemPath.length).join(".") === itemPath.join("."),
      );
    });

    const firstPart =
      firstInvalidItemIndex !== -1 ? data.slice(0, firstInvalidItemIndex) : [];
    const secondPart =
      firstInvalidItemIndex !== -1 && lastInvalidItemIndex !== -1
        ? data.slice(firstInvalidItemIndex, lastInvalidItemIndex + 1)
        : data;
    const thirdPart =
      lastInvalidItemIndex !== -1 ? data.slice(lastInvalidItemIndex + 1) : [];

    return (
      <>
        <Line
          num={runningLineNum++}
          propertyKey={propertyKey}
          bracket="["
          indentation={indentation}
          path={path}
          error={error}
          onSelectUnionErrorIndex={setSelectedUnionErrorIndex}
          unionErrorIndex={unionErrorIndex}
          theme={theme}
          onToggleTruncate={onToggleTruncate}
          toggleButtonRef={toggleButtonRef}
          truncated={truncated}
          rootData={rootData}
        />
        {firstPart.length > 5 && truncateStart ? (
          <Line
            num={(() => {
              const num = runningLineNum;
              runningLineNum += countLines(firstPart) - 2;
              return num;
            })()}
            onToggleTruncate={() => {
              flushSync(() => {
                setTruncateStart(!truncateStart);
              });
              startToggleButtonRef.current?.focus();
            }}
            toggleButtonRef={startToggleButtonRef}
            indentation={indentation + 1}
            theme={theme}
            truncated
            rootData={rootData}
          />
        ) : (
          firstPart.map((value, i) => {
            const numLines = countLines(firstPart[i]);
            runningLineNum += numLines;
            return (
              <RecursiveViewer
                key={i}
                data={value}
                error={unionError || error}
                comma={i !== data.length - 1}
                indentation={indentation + 1}
                lineNum={runningLineNum - numLines}
                path={[...path, i]}
                theme={theme}
                countLines={countLines}
                onToggleTruncate={
                  i === 0 && firstPart.length > 5
                    ? () => {
                        flushSync(() => {
                          setTruncateStart(!truncateStart);
                        });
                        startToggleButtonRef.current?.focus();
                      }
                    : undefined
                }
                toggleButtonRef={startToggleButtonRef}
                rootData={rootData}
              />
            );
          })
        )}
        {secondPart.map((value, i) => {
          const numLines = countLines(secondPart[i]);
          runningLineNum += numLines;
          return (
            <RecursiveViewer
              key={i}
              data={value}
              error={unionError || error}
              comma={i !== data.length - 1}
              indentation={indentation + 1}
              lineNum={runningLineNum - numLines}
              path={[...path, i + firstPart.length]}
              theme={theme}
              countLines={countLines}
              rootData={rootData}
            />
          );
        })}
        {thirdPart.length > 5 && truncateEnd ? (
          <Line
            num={(() => {
              const num = runningLineNum;
              runningLineNum += countLines(thirdPart) - 2;
              return num;
            })()}
            onToggleTruncate={() => {
              flushSync(() => {
                setTruncateEnd(!truncateEnd);
              });
              endToggleButtonRef.current?.focus();
            }}
            toggleButtonRef={endToggleButtonRef}
            truncated
            indentation={indentation + 1}
            theme={theme}
            rootData={rootData}
          />
        ) : (
          thirdPart.map((value, i) => {
            const numLines = countLines(thirdPart[i]);
            runningLineNum += numLines;
            return (
              <RecursiveViewer
                key={i}
                data={value}
                error={unionError || error}
                comma={i !== thirdPart.length - 1}
                indentation={indentation + 1}
                lineNum={runningLineNum - numLines}
                path={[...path, i + firstPart.length + secondPart.length]}
                theme={theme}
                countLines={countLines}
                onToggleTruncate={
                  i === 0 && thirdPart.length > 5
                    ? () => {
                        flushSync(() => {
                          setTruncateEnd(!truncateEnd);
                        });
                        endToggleButtonRef.current?.focus();
                      }
                    : undefined
                }
                toggleButtonRef={endToggleButtonRef}
                rootData={rootData}
              />
            );
          })
        )}
        <Line
          bracket="]"
          indentation={indentation}
          comma={comma}
          num={runningLineNum++}
          theme={theme}
          rootData={rootData}
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
        onToggleTruncate={onToggleTruncate}
        toggleButtonRef={toggleButtonRef}
        truncated={truncated}
        rootData={rootData}
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
            rootData={rootData}
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
        theme={theme}
        rootData={rootData}
      />
    </>
  );
}

/**
 * Gets the union error at a specific index
 */
function getUnionError({
  error,
  path,
  index,
}: {
  error: ZodError;
  path: Array<string | number>;
  index: number;
}) {
  const unionIssue = error.issues.find(
    (issue): issue is Extract<typeof issue, { code: "invalid_union" }> =>
      issue.code === ZodIssueCode.invalid_union &&
      issue.path.join(".") === path.join("."),
  );
  return unionIssue ? unionIssue.unionErrors[index] : undefined;
}

function getRelevantIssues({
  error,
  path = [],
  rootData,
}: {
  error: ZodError;
  path?: Array<string | number>;
  rootData: unknown;
}) {
  const relevantIssues =
    error.issues.filter((issue) => issue.path.join(".") === path?.join(".")) ||
    [];

  const missingKeys = [];
  for (const issue of error.issues) {
    if (isMissing({ issue, objPath: path, rootData })) {
      missingKeys.push(issue.path[issue.path.length - 1]);
    } else if (
      issue.code === ZodIssueCode.invalid_union &&
      issue.unionErrors.every((err) =>
        err.issues.some((iss) =>
          isMissing({ issue: iss, objPath: path, rootData }),
        ),
      )
    ) {
      missingKeys.push(issue.path[issue.path.length - 1]);
    }
  }

  if (missingKeys.length > 0) {
    relevantIssues.push({
      code: ZodIssueCode.custom,
      path,
      message:
        missingKeys.length === 1
          ? `Object missing required key: '${missingKeys[0]}'`
          : `Object missing required keys: ${missingKeys.map((key) => `'${key}'`).join(", ")}`,
    });
  }

  return relevantIssues;
}

function isMissing({
  issue,
  objPath,
  rootData,
}: {
  issue: ZodIssue;
  objPath: Array<string | number>;
  rootData: unknown;
}) {
  if (
    issue.code === ZodIssueCode.invalid_type &&
    issue.received === "undefined" &&
    issue.path.slice(0, issue.path.length - 1).join(".") === objPath.join(".")
  ) {
    return true;
  }

  if (
    issue.code === ZodIssueCode.invalid_literal &&
    typeof issue.received === "undefined" &&
    issue.path.slice(0, issue.path.length - 1).join(".") === objPath.join(".")
  ) {
    return true;
  }

  if (
    issue.code === ZodIssueCode.invalid_union_discriminator &&
    issue.path.slice(0, issue.path.length - 1).join(".") ===
      objPath.join(".") &&
    typeof getValueAtPath(rootData, issue.path) === "undefined"
  ) {
    return true;
  }

  return false;
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
  onToggleTruncate,
  toggleButtonRef,
  truncated,
  rootData,
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
  onToggleTruncate?: () => void;
  toggleButtonRef?: React.RefObject<HTMLButtonElement>;
  truncated?: boolean;
  rootData: unknown;
}) {
  const issues = error ? getRelevantIssues({ error, path, rootData }) : [];
  const issue = issues[0];
  const unionError =
    error &&
    path &&
    getUnionError({
      error,
      path,
      index: unionErrorIndex,
    });

  return (
    <div
      style={{
        backgroundColor: issues.length > 0 ? theme.errorBackground : undefined,
        height: "1.65em",
      }}
    >
      <span
        style={{
          width: "3.25em",
          paddingRight: "0.3em",
          backgroundColor: theme.lineNumberBackground,
          display: "inline-block",
          textAlign: "right",
          fontFamily: "monospace",
          userSelect: "none",
          color: theme.lineNumber,
          boxSizing: "border-box",
          height: "1.65em",
          lineHeight: "1.65em",
          overflow: "hidden",
          position: "sticky",
          left: 0,
          zIndex: 1,
        }}
      >
        {num}
      </span>
      <pre
        style={{
          display: "inline-block",
          paddingLeft: "0.3em",
          paddingRight: "0.6em",
          fontFamily: "monospace",
          tabSize: "1.5em",
          margin: 0,
          boxSizing: "border-box",
          height: "1.65em",
          lineHeight: "1.65em",
          overflow: "hidden",
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
          <span style={{ color: theme.string }}>
            {`"`}
            {value.split("\n").map((line, idx, arr) => (
              <>
                {line}
                {idx !== arr.length - 1 && (
                  <span style={{ color: theme.newline }}>{"↵"}</span>
                )}
              </>
            ))}
            {`"`}
          </span>
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

        {/* TRUNCATION */}
        {onToggleTruncate && (
          <button
            type="button"
            onClick={onToggleTruncate}
            ref={toggleButtonRef}
            aria-label={truncated ? "Expand" : "Collapse"}
            style={{
              boxSizing: "border-box",
              appearance: "none",
              background: "none",
              border: "none",
              backgroundColor: theme.truncationBackground,
              borderRadius: "0.25em",
              cursor: "pointer",
              fontFamily: "monospace",
              letterSpacing: "-0.2rem",
              color: theme.truncation,
              overflow: "hidden", // Hide overflow so focus outline is still rectangular

              // Don't allow selecting / copying the ellipsis when truncated.
              // Ellipsis does not mean anything when pasted
              userSelect: !truncated ? "none" : undefined,
            }}
          >
            <span
              style={{
                boxSizing: "border-box",
                position: "relative",
                top: "-0.2rem",
                left: "0.04rem",
              }}
            >
              {/* Only show // when copying / pasting text.  This is so the JSON can still be parsed (if using jsonc) */}
              <span aria-hidden style={srOnly}>
                //{" "}
              </span>
              ...{" "}
              {truncated && (
                // When copying / pasting text, add "truncated" to be more descriptive
                <span style={srOnly} aria-hidden>
                  truncated ...
                </span>
              )}
            </span>
          </button>
        )}

        {issue && (
          <span style={{ color: theme.errorForeground }}>
            <ErrorIcon />
            {/* When copying / pasting text, add "// Error:" To be more descriptive and so JSON can still be parsed (if using jsonc) */}
            <span style={srOnly}>
              {" "}
              <span aria-hidden>//</span> Error:{" "}
            </span>
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
                  {unionError
                    ? getRelevantIssues({
                        error: unionError,
                        path,
                        rootData,
                      })[0]?.message
                    : undefined}
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
          borderRadius: "0.25em",
          fontSize: "0.85em",
          backgroundColor: theme.background,
          lineHeight: 0,
          verticalAlign: "middle",
        }}
      >
        <span
          style={{
            paddingLeft: "0.5em",
            paddingRight: "0.5em",
            verticalAlign: "middle",
          }}
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
      height="1.5em"
      viewBox="0 -960 960 960"
      width="1.5em"
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
      height="1.5em"
      viewBox="0 -960 960 960"
      width="1.5em"
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
        marginLeft: "1em",
        marginRight: "0.4em",
        display: "inline",
        userSelect: "none",
        verticalAlign: "middle",
        marginTop: "-0.15em",
      }}
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 20 20"
    >
      <path
        fill="currentColor"
        d="M13.728 1H6.272L1 6.272v7.456L6.272 19h7.456L19 13.728V6.272zM11 15H9v-2h2zm0-4H9V5h2z"
      />
    </svg>
  );
}

function createMemoizedCountLines(rootData: unknown) {
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

  countLines(rootData);

  return countLines;
}

/**
 * Polyfill for https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findLastIndex
 */
function findLastIndex<T>(
  arr: T[],
  predicate: (value: T, idx: number) => boolean,
) {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i]!, i)) {
      return i;
    }
  }

  return -1;
}

function getValueAtPath(data: unknown, path: Array<string | number>) {
  let value = data;
  for (const pathPart of path) {
    if (typeof value === "object" && value) {
      if (pathPart in value) {
        // @ts-expect-error Not sure how to narrow this so TS is okay
        value = value[pathPart];
      } else {
        return undefined;
      }
    }
  }
  return value;
}

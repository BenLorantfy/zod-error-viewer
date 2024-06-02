"use client";

import { CSSProperties, useState } from "react";
import { z, ZodError, ZodIssueCode } from "zod";

const theme = {
  lineNumberBackground: "#f0f0f0",
  stringColor: "#95261f",
  numColor: "#3c845c",
  booleanColor: "#0e0ef6",
  nullColor: "#0e0ef6",
  undefinedColor: "#0e0ef6",
  keyColor: "#22509f",
  errorBackgroundColor: "#FFF0F0",
  errorForegroundColor: "#C71A1A",
};

export function ZodErrorViewer({
  data,
  error,
}: {
  data: unknown;
  error: z.ZodError;
}) {
  return (
    <div style={{ fontSize: "1rem" }}>
      <RecursiveViewer data={data} error={error} path={[]} />
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
}: {
  propertyKey?: string;
  data: unknown;
  error: z.ZodError;
  comma?: boolean;
  indentation?: number;
  lineNum?: number;
  path: Array<string | number>;
}) {
  // TODO: default this correctly
  const [selectedUnionError, setSelectedUnionError] = useState<ZodError>();
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
        onSelectUnionError={setSelectedUnionError}
        selectedUnionError={selectedUnionError}
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
          onSelectUnionError={setSelectedUnionError}
          selectedUnionError={selectedUnionError}
        />
        {data.map((value, i) => {
          runningLineNum += i === 0 ? 1 : countLines(data[i - 1]);
          return (
            <RecursiveViewer
              key={i}
              data={value}
              error={selectedUnionError || error}
              comma={i !== data.length - 1}
              indentation={indentation + 1}
              lineNum={runningLineNum}
              path={[...path, i]}
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
        onSelectUnionError={setSelectedUnionError}
        selectedUnionError={selectedUnionError}
      />
      {entries.map(([key, value], i) => {
        runningLineNum += i === 0 ? 1 : countLines(entries[i - 1]?.[1]);
        return (
          <RecursiveViewer
            key={key}
            propertyKey={key}
            data={value}
            error={selectedUnionError || error}
            comma={i !== entries.length - 1}
            indentation={indentation + 1}
            lineNum={runningLineNum}
            path={[...path, key]}
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
      />
    </>
  );
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
  selectedUnionError,
  onSelectUnionError,
}: {
  num: number;
  value?: unknown;
  propertyKey?: unknown;
  bracket?: string;
  error?: ZodError;
  indentation?: number;
  comma?: boolean;
  path?: Array<string | number>;
  selectedUnionError?: ZodError;
  onSelectUnionError?: (err: ZodError) => void;
}) {
  const issues =
    error?.issues.filter((issue) => issue.path.join(".") === path?.join(".")) ||
    [];
  const issue = issues[0];

  const unionIndex =
    !selectedUnionError || !issue || issue.code !== ZodIssueCode.invalid_union
      ? 0
      : issue.unionErrors.findIndex(
          (unionError) => unionError === selectedUnionError,
        );

  return (
    <div
      style={{
        backgroundColor:
          issues.length > 0 ? theme.errorBackgroundColor : undefined,
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
          <span style={{ color: theme.keyColor }}>{`"${propertyKey}"`}</span>
        )}
        {!!propertyKey && <span>: </span>}

        {/* VALUE */}
        {typeof value === "string" && (
          <span style={{ color: theme.stringColor }}>{`"${value}"`}</span>
        )}
        {typeof value === "number" && (
          <span style={{ color: theme.numColor }}>{value}</span>
        )}
        {typeof value === "boolean" && value && (
          <span style={{ color: theme.booleanColor }}>true</span>
        )}
        {typeof value === "boolean" && !value && (
          <span style={{ color: theme.booleanColor }}>false</span>
        )}
        {value === null && <span style={{ color: theme.nullColor }}>null</span>}

        {/* BRACKET */}
        {bracket}

        {/* COMMA */}
        {comma && <span>,</span>}

        {issue && (
          <span style={{ color: theme.errorForegroundColor }}>
            <ErrorIcon />
            <span style={srOnly}>&nbsp;//&nbsp;Error:&nbsp;</span>
            <span>
              {issue.code === ZodIssueCode.invalid_union
                ? "Invalid union entry"
                : issue.message}
            </span>
            <span>
              {issue.code === ZodIssueCode.invalid_union && (
                <>
                  <ErrorSwitcher
                    index={unionIndex}
                    max={issue.unionErrors.length}
                    // TODO: Remove null assertions
                    onPrev={() =>
                      onSelectUnionError?.(issue.unionErrors[unionIndex - 1]!)
                    }
                    onNext={() =>
                      onSelectUnionError?.(issue.unionErrors[unionIndex + 1]!)
                    }
                  />
                  {`: `}
                  {
                    issue.unionErrors[unionIndex]!.issues.find(
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
}: {
  index: number;
  max: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <>
      {` `}
      <div
        style={{
          display: "inline-block",
          border: `1px solid ${theme.errorForegroundColor}`,
          borderRadius: "4px",
          fontSize: "0.85rem",
          backgroundColor: "white",
        }}
      >
        <span
          style={{ padding: "2px", paddingLeft: "8px", paddingRight: "8px" }}
        >
          {index + 1}/{max}
        </span>
        <button
          type="button"
          onClick={onPrev}
          style={{
            ...buttonStyle,
            borderRight: "1px solid white",
          }}
          aria-label="Previous union error"
        >
          <ChevronLeftIcon />
        </button>
        <button
          type="button"
          onClick={onNext}
          style={buttonStyle}
          aria-label="Nexr union error"
        >
          <ChevronRightIcon />
        </button>
      </div>
      {` `}
    </>
  );
}

const buttonStyle: CSSProperties = {
  appearance: "none",
  backgroundColor: theme.errorForegroundColor,
  color: "white",
  border: "none",
  fontSize: "0.75rem",
  cursor: "pointer",
  padding: "2px",
  paddingLeft: "6px",
  paddingRight: "6px",
  userSelect: "none",
};

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

// TODO: make this use memoization?
function countLines(data: unknown): number {
  if (typeof data !== "object" || data === null) {
    return 1;
  }

  if (Array.isArray(data)) {
    return 2 + data.reduce((acc, curr) => acc + countLines(curr), 0);
  }

  return (
    2 +
    Object.entries(data).reduce((acc, [, value]) => acc + countLines(value), 0)
  );
}

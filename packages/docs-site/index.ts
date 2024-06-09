// function PlaygroundView() {
//     const [dataStr, setDataStr] = useState("");
//     const [errorStr, setErrorStr] = useState("");
//     const [schemaStr, setSchemaStr] = useState("");

//     const { data, dataParseError } = useMemo(() => {
//       if (dataStr.trim().length === 0) {
//         return {
//           data: null,
//         };
//       }
//       try {
//         return { data: JSON.parse(dataStr) };
//       } catch (err) {
//         return {
//           data: null,
//           dataParseError: err instanceof Error ? err : new Error("Unknown error"),
//         };
//       }
//     }, [dataStr]);

//     const { schema, schemaEvalError } = useMemo(() => {
//       try {
//         Object.assign(window, { z });
//         const schema = eval(`const z = window.z; ${schemaStr}`);
//         if (!schema || !("_def" in schema)) {
//           return {
//             schema: null,
//             schemaEvalError:
//               (schemaStr || "").trim().length > 0
//                 ? new Error("Missing schema")
//                 : null,
//           };
//         }
//         return {
//           schema,
//           schemaEvalError: null,
//         };
//       } catch (err) {
//         return {
//           schema: null,
//           schemaEvalError:
//             err instanceof Error ? err : new Error("Unknown error"),
//         };
//       }
//     }, [schemaStr]);

//     const { error, errorParseError, schemaExecuteError } = useMemo(() => {
//       if (errorStr.trim().length !== 0) {
//         try {
//           return { error: JSON.parse(errorStr) };
//         } catch (err) {
//           return {
//             error: undefined,
//             errorParseError:
//               err instanceof Error ? err : new Error("Unknown error"),
//           };
//         }
//       }

//       if (!schema) {
//         return {
//           error: undefined,
//         };
//       }

//       try {
//         return { error: schema.safeParse(data).error };
//       } catch (err) {
//         return {
//           error: undefined,
//           schemaExecuteError:
//             err instanceof Error ? err : new Error("Unknown error"),
//         };
//       }
//     }, [errorStr, schema, data]);

//     return (
//       <div className="playground">
//         <nav>
//           <ul>
//             <li>
//               <a href="/">
//                 <span
//                   style={{
//                     display: "inline-block",
//                     height: 0,
//                     position: "relative",
//                     top: "-14px",
//                   }}
//                 >
//                   <img
//                     alt=""
//                     src={logo}
//                     height="30px"
//                     width="71px"
//                     style={{ verticalAlign: "middle", marginRight: "8px" }}
//                   />
//                 </span>
//                 <span style={{ verticalAlign: "middle" }}>zod-error-viewer</span>
//               </a>
//             </li>
//             <li>
//               <a href="/">Docs</a>
//             </li>
//             <li>
//               <a href="/iframe.html?id=zoderrorviewer--playground&viewMode=story">
//                 Playground
//               </a>
//             </li>
//           </ul>
//         </nav>
//         <main>
//           <h1>Playground</h1>
//           <div
//             style={{
//               display: "flex",
//               gap: "8px",
//               flexGrow: 0,
//             }}
//           >
//             <section className="editor-column" aria-labelledby="data-heading">
//               <div className="editor">
//                 <h2 id="data-heading">DATA</h2>
//                 <CodeMirror
//                   value={dataStr}
//                   height="300px"
//                   extensions={[javascript()]}
//                   onChange={setDataStr}
//                 />
//               </div>
//               <div id="data-error" className="error" role="alert">
//                 {dataParseError?.message
//                   ? `Failed to parse error: ${dataParseError.message}`
//                   : ""}
//               </div>
//             </section>
//             <section
//               className="editor-column"
//               aria-labelledby="error-heading"
//               aria-describedby="error-error"
//             >
//               <div className="editor">
//                 <h2 id="error-heading">
//                   <span style={{ verticalAlign: "middle" }}>ERROR</span>{" "}
//                   <span className="tag">Optional</span>
//                 </h2>
//                 <CodeMirror
//                   value={errorStr}
//                   height="300px"
//                   extensions={[javascript()]}
//                   onChange={setErrorStr}
//                 />
//               </div>
//               <div id="error-error" className="error" role="alert">
//                 {errorParseError?.message
//                   ? `Failed to parse error: ${errorParseError.message}`
//                   : ""}
//               </div>
//             </section>

//             <section
//               className="editor-column"
//               aria-labelledby="schema-heading"
//               aria-describedby="schema-eval-error"
//             >
//               <div className="editor">
//                 <h2 id="schema-heading">
//                   <span style={{ verticalAlign: "middle" }}>SCHEMA</span>{" "}
//                   <span className="tag">Optional</span>
//                 </h2>
//                 <CodeMirror
//                   value={schemaStr}
//                   height="300px"
//                   extensions={[javascript()]}
//                   onChange={setSchemaStr}
//                 />
//               </div>
//               <div id="schema-eval-error" className="error" role="alert">
//                 {schemaExecuteError?.message
//                   ? `Failed to execute schema: ${schemaExecuteError}`
//                   : schemaEvalError?.message
//                     ? `Failed to parse schema: ${schemaEvalError.message}`
//                     : ""}
//               </div>
//             </section>
//           </div>
//           <div className="error-viewer-container editor">
//             <h2>ERROR VIEWER</h2>
//             <div className="error-viewer">
//               <ZodErrorViewer data={data} error={error} height="fill" />
//             </div>
//           </div>
//         </main>
//       </div>
//     );
//   }

//   export const Playground: StoryObj = {
//     parameters: {
//       layout: "fullscreen",
//     },
//     render: () => <PlaygroundView />,
//   };

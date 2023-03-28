import { useEffect, useState } from "react";
import { BsArrowReturnRight } from "react-icons/bs";
import { BiCheck, BiX } from "react-icons/bi";
import { IoIosTimer } from "react-icons/io";
import FadeIn from "react-fade-in";
import "./App.css";
import { vscode } from "./context";

function Result(props: { result: any; i: number }) {
  const isPassed = props.result.isPassed && !props.result.error.msg;
  return (
    <div className="result-section" data-passed={isPassed ? "true" : "false"}>
      <div className="result__heading">
        {isPassed ? <BiCheck size={16} /> : <BiX size={16} />}
        <div className="result__heading-text">
          <h2>Test {props.i + 1}</h2>
          <div className="result__heading-time-box">
            <IoIosTimer size={12} />
            <div className="result__heading-time">
              {props.result.time}ms
              {props.result.error.timedOut && "+ / TIMED OUT"}
            </div>
          </div>
        </div>
      </div>
      <div className="result__body">
        {isPassed ? (
          <div className="result__passed-out">
            <BsArrowReturnRight />
            <code>{props.result.output}</code>
          </div>
        ) : (
          <>
            <div className="result__input-container">
              <code title="Input value">{props.result.input}</code>
            </div>
            <div className="result__expected-container">
              <div className="result__expected-text">Expected</div>
              <code>{props.result.expected}</code>
            </div>
            <div className="result__actual-container">
              <div className="result__actual-text">Actual</div>
              <code>{props.result.output}</code>
            </div>
            {props.result.error.msg && (
              <div className="result__error-container">
                <code title="Runtime error">{props.result.error.msg}</code>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function App() {
  const [taskInfo, setTaskInfo] = useState({
    contestId: "",
    index: "",
  });

  const [results, setResults] = useState([]);
  const [compileErr, setCompileErr] = useState({ msg: undefined });

  useEffect(() => {
    window.addEventListener("message", (e) => {
      const msg = e.data;

      switch (msg.id) {
        case "task-info":
          setTaskInfo(msg.data);
        case "results": {
          if (msg.data.results) {
            setResults(msg.data.results);
          } else {
            setResults([]);
          }
          if (msg.data.compileError) {
            setCompileErr(msg.data.compileError);
          } else {
            setCompileErr({ msg: undefined });
          }
        }
      }
    });
  }, []);

  return (
    <>
      {taskInfo.contestId === "" ? (
        <>
          <header>
            <h1>AtCoder Run</h1>
          </header>
          <button
            onClick={() => {
              vscode.postMessage({
                id: "run-test",
              });
            }}
          >
            Run Test
          </button>
        </>
      ) : (
        <>
          <header>
            <h1>
              {taskInfo.contestId.toUpperCase()} -{" "}
              {taskInfo.index.toUpperCase()}
            </h1>
          </header>
          <FadeIn>
            {compileErr.msg && (
              <div className="compile-error-section">
                <h2>COMPILE ERROR</h2>
                <code>{compileErr.msg}</code>
              </div>
            )}
          </FadeIn>
          <FadeIn className="results-container">
            {results.map((result: any, i) => {
              return <Result result={result} i={i} />;
            })}
          </FadeIn>
        </>
      )}
    </>
  );
}

export default App;

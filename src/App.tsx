import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";
const { listen } = await import("@tauri-apps/api/event");
import { ThreeCircles } from "react-loader-spinner";

interface ScanDirResponse {
  total_files: number;
  total_images: number;
  total_errors: number;
  errors: string[];
}

function App() {
  const [includeSubfolders, setIncludeSubfolders] = useState(true);
  const [isDropActive, setIsDropActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null as ScanDirResponse | null);

  useEffect(() => {
    let unlisten = () => {};

    const unlistenP = listen("tauri://file-drop", async (event) => {
      console.log("file-drop:", event);
      const files = event.payload as string[];

      setIsProcessing(true);
      setIsDropActive(false);

      const response = (await invoke("scan_dir", {
        directory: files[0],
        // includeSubfolders,
      })) as ScanDirResponse;

      console.log(response);

      setIsProcessing(false);
      setResults(response);
    });

    unlistenP.then((unlistenFn) => {
      unlisten = unlistenFn;
    });

    return () => {
      unlisten();
    };
  }, []);

  useEffect(() => {
    let unlisten = () => {};

    const unlistenP = listen("tauri://file-drop-hover", async (event) => {
      console.log("file-drop-hover:", event);
      setIsDropActive(true);
    });

    unlistenP.then((unlistenFn) => {
      unlisten = unlistenFn;
    });

    return () => {
      unlisten();
    };
  }, []);

  useEffect(() => {
    let unlisten = () => {};

    const unlistenP = listen("tauri://file-drop-cancelled", async (event) => {
      console.log("file-drop-cancelled:", event);
      setIsDropActive(false);
    });

    unlistenP.then((unlistenFn) => {
      unlisten = unlistenFn;
    });

    return () => {
      unlisten();
    };
  }, []);

  // useEffect(() => {
  //   invoke("scan_dir", { directory: "/Users/ben/Desktop/tmp" })
  //     .then((response) => {
  //       console.log(response);
  //     })
  //     .catch((err) => {
  //       console.error(err);
  //     });
  // }, []);

  useEffect(() => {
    invoke("showup");
  }, []);


  if (results) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "start",
          justifyContent: "left",
          margin: 0,
          padding: 10,
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          gap: "10px",
          // overflowY: "scroll",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            justifyContent: "center",
            alignSelf: "center",
          }}
        >
          {/* Tick */}
          {results.total_errors === 0 ? (
            <svg width="112" height="112" viewBox="0 0 24 24">
              <path
                // green
                fill="#4caf50"
                d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
              />
            </svg>
          ) : (
            <svg width="112" height="112" viewBox="0 0 24 24">
              {/* Warning */}
              {/* <path
                // yellow warning triangle
                fill="#ffc107"
                d="M12 2L1 21h22L12 2zm0 17l5.5-6h-11l5.5 6z"
              /> */}
              <path
                // red exclamation
                fill="#f44336"
                d="M11 15h2v2h-2zm0-8h2v6h-2z"
              />
            </svg>
          )}
        </div>
        <p
          style={{
            fontSize: "18px",
            // fontWeight: "bold",
            textAlign: "center",
            width: "100%",
            margin: 0,
          }}
        >
          {results.total_images} images found, {results.total_errors} corrupted
        </p>
        

        {results.errors.length > 0 && (
          <>
            {/* <table>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Files</th>
                  <th style={{ textAlign: "left" }}>Images</th>
                  <th style={{ textAlign: "left" }}>Errors</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{results.total_files}</td>
                  <td>{results.total_images}</td>
                  <td>{results.total_errors}</td>
                </tr>
              </tbody>
            </table> */}
            <table>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Corrupted Files</th>
                </tr>
              </thead>
              <tbody>
                {results.errors.map((error) => {
                  const [file, _] = error.split(":");
                  return (
                    <tr>
                      <td>{file}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}

<div
          style={{
            display: "flex",
            justifyContent: "center",
            width: "100%",
          }}
        >
          <button
            style={{
              backgroundColor: "#333",
              color: "white",
              border: "none",
              padding: "10px",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "14px",
              marginBottom: "10px",
            }}
            onClick={() => setResults(null)}
          >
            New Scan
          </button>
        </div>

      </div>
    );
  }

  if (isProcessing) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          alignItems: "center",
          height: "100vh",
          justifyContent: "center",
          margin: 0,
          padding: 0,
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
        }}
      >
        <ThreeCircles color={"#333"} height={60} width={60} />
        <p>Scanning for corrupted images...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        padding: "10px",
        gap: "10px",
      }}
    >
      <section
        style={{
          border: isDropActive ? "1px dashed blue" : "1px dashed black",
          textAlign: "center",
          flexGrow: 1,
          borderRadius: "5px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "10px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <p>Drop some files or a folder here to scan for corrupted images</p>

          <div
            style={{ display: "flex", justifyContent: "center", gap: "10px" }}
          >
            {/* <button
              style={{
                backgroundColor: "#333",
                color: "white",
                border: "none",
                padding: "10px",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "14px",
              }}
              onClick={async () => {
                const response = await invoke("open_dialog", {
                  multiple: false,
                  directory: true,
                });
                console.log(response);
              }}
            >
              Scan Folder
            </button>
            <button
              style={{
                backgroundColor: "#333",
                color: "white",
                border: "none",
                padding: "10px",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "14px",
              }}
              onClick={async () => {
                const response = await invoke("open_dialog", {
                  multiple: true,
                  directory: false,
                });
                console.log(response);
              }}
            >
              Choose Files
            </button> */}
          </div>
        </div>
      </section>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          gap: "10px",
          alignItems: "center",
        }}
      >
        <label htmlFor="includeSubfolders">Include Subfolders</label>
        <input
          type="checkbox"
          name="includeSubfolders"
          id="includeSubfolders"
          checked={includeSubfolders}
          onChange={(e) => {
            setIncludeSubfolders(e.target.checked);
          }}
        />
      </div>
    </div>
  );
}

export default App;

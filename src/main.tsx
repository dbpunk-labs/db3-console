import React from "react";
import ReactDOM from "react-dom/client";
import { RecoilRoot } from "recoil";
import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import App from "./App";
import "antd/dist/antd.css";
import "./index.css";

// document.domain = "db3.network";
self.MonacoEnvironment = {
	getWorker(_, label) {
		return new editorWorker();
	},
};

loader.config({ monaco });

loader.init();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<RecoilRoot>
		<App />
	</RecoilRoot>,
);

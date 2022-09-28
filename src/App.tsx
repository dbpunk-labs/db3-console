import { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Spin } from "antd";
import { keyring } from "@polkadot/ui-keyring";
import Console from "./components/Console.component";
import Authorization from "./components/Authorization.component";
import * as db3 from "./db3";
import "./App.css";

function App() {
	return (
		<div className='App'>
			<Router>
				<Routes>
					<Route path='/:ownerAddress' element={<Console />}></Route>
					<Route
						path='/authorization/:ownerAddress/:delegateAddress'
						element={<Authorization />}
					/>
				</Routes>
			</Router>
		</div>
	);
}

export default () => {
	const [ready, setReady] = useState(false);
	useEffect(() => {
		db3.init({
			appName: "db3",
			node: "wss://dev.db3.network/ws",
		})
			.then(() => {
				return db3.loadAccounts("db3");
			})
			.then(() => {
				db3.setCurrentAccount(
					keyring.getPair(
						"5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
					),
				);
				setReady(true);
			});
	}, []);

	return (
		<Spin spinning={!ready} tip='Connecting to DB3' size='large'>
			{ready && <App />}
		</Spin>
	);
};

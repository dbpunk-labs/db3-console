import { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Layout, Spin } from "antd";
import { keyring } from "@polkadot/ui-keyring";
import Console from "./components/Console.component";
import Authorization from "./components/Authorization.component";
import * as db3 from "./db3";
import "./App.scss";
import Account from "./components/Account.component";

const { Header, Content, Footer } = Layout;

function App() {
	return (
		<div className='App'>
			<Layout className='layout'>
				<Header className='header'>
					<div className='logo'>DB3</div>
					<Account />
				</Header>
				<Content style={{ padding: "20px 0" }}>
					<Router>
						<Routes>
							<Route
								path='/:ownerAddress'
								element={<Console />}
							></Route>
							<Route
								path='/authorization/:ownerAddress/:delegateAddress'
								element={<Authorization />}
							/>
						</Routes>
					</Router>
				</Content>
				<Footer style={{ textAlign: "center" }}>合约地址</Footer>
			</Layout>
		</div>
	);
}

export default () => {
	const [ready, setReady] = useState(false);
	useEffect(() => {
		db3.init({
			appName: "db3",
			node: import.meta.env.VITE_RPC,
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
		<Spin
			spinning={!ready}
			tip='Connecting to DB3'
			size='large'
			style={{ top: 130 }}
		>
			{ready && <App />}
		</Spin>
	);
};

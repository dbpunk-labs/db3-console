// @ts-nocheck
import React, { memo, Suspense } from "react";
import { Upload, Button } from "antd";
import { keyring } from "@polkadot/ui-keyring";
import * as db3 from "../db3";
import SQLEditor from "./SQLEditor.component";
import { useRecoilState, useSetRecoilState } from "recoil";
import { ownerAddressAtom } from "../state";

const Console: React.FC<{}> = memo((props) => {
	const uploadUrl = URL.createObjectURL(
		new Blob([], { type: "application/json" }),
	);
	const setOwnerAddress = useSetRecoilState(ownerAddressAtom);
	function importAccount({ file }) {
		const reader = new FileReader();
		reader.onload = function (evt) {
			const keyringJson = JSON.parse(evt.target.result);
			const restoredPair = keyring.createFromJson(keyringJson);
			keyring.addPair(restoredPair, "12345678");
			db3.setCurrentAccount(keyring.getPair(keyringJson.address));
			setOwnerAddress(keyringJson.address);
		};
		reader.readAsText(file.originFileObj);
		return Promise.resolve();
	}
	return (
		<div style={{ padding: 20 }}>
			<Upload
				action={uploadUrl}
				showUploadList={false}
				onChange={importAccount}
			>
				<Button>Choose Account</Button>
			</Upload>
			<Suspense>
				<SQLEditor />
			</Suspense>
		</div>
	);
});
export default Console;

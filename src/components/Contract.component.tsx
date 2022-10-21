import React, { memo } from "react";
import rpc from "../api/rpc.api";
import { useAsyncFn, useAsync } from "react-use";
import { useParams } from "react-router-dom";
import SyntaxHighlighter from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";

const Contract: React.FC<{}> = memo((props) => {
	const { contactAddress } = useParams();
	const contractInfoState = useAsync(async () => {
		const { result } = await rpc("get_contract", [contactAddress]);
		return result;
	}, []);
	return (
		<div>
			<SyntaxHighlighter language='javascript' style={docco}>
				{contractInfoState.value}
			</SyntaxHighlighter>
		</div>
	);
});
export default Contract;

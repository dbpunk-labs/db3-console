import React, { memo } from "react";
import SQLEditor from "./SQLEditor.component";

const Console: React.FC<{}> = memo((props) => {
	return (
		<div>
			<SQLEditor />
		</div>
	);
});
export default Console;

import React, { memo, Suspense } from "react";
import SQLEditor from "./SQLEditor.component";

const Console: React.FC<{}> = memo((props) => {
	return (
		<Suspense>
			<SQLEditor />
		</Suspense>
	);
});
export default Console;

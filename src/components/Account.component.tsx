import React, { memo } from "react";
import { Select, Avatar, Space } from "antd";
import { UserOutlined } from "@ant-design/icons";

const Account: React.FC<{}> = memo((props) => {
	return (
		<div style={{ color: "#fff" }}>
			<Space>
				ALICE
				<Avatar
					style={{ backgroundColor: "#87d068" }}
					icon={<UserOutlined />}
				/>
			</Space>
		</div>
	);
});
export default Account;

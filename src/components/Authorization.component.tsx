// @ts-nocheck
import React, { memo, useState } from "react";
import {
	Steps,
	Space,
	Tree,
	Radio,
	Button,
	message,
	Typography,
	Tooltip,
} from "antd";
import { UserOutlined, HddOutlined, TableOutlined } from "@ant-design/icons";
import SyntaxHighlighter from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { sqlCode } from "./sql";
import { useAsyncFn } from "react-use";
import { keyring } from "@polkadot/ui-keyring";
import * as db3 from "../db3";
import "../styles/authorizaton.scss";
import { useParams } from "react-router-dom";

const { Step } = Steps;
const { Paragraph, Title } = Typography;

const Authorization: React.FC<{}> = memo((props) => {
	const { ownerAddress, delegateAddress } = useParams();
	const treeData = [
		{
			title: (
				<div className='tree-header'>Owner account: {ownerAddress}</div>
			),
			key: "0-0",
			icon: <UserOutlined />,
			children: [
				{
					title: "nameSpace: StepnPlus",
					key: "0-0-0",
					icon: <HddOutlined />,
					children: [
						{
							title: "table: location",
							key: "0-0-0-1",
							icon: <TableOutlined />,
						},
					],
				},
			],
		},
	];
	const [access, setAccess] = useState(false);
	const [allowAccessState, allowAccess] = useAsyncFn(async () => {
		try {
			const result = await db3.createNsAndAddDelegate(
				delegateAddress!,
				keyring.getPair(ownerAddress!),
			);
			if (result.status === 0) {
				// db3.runSqlByDelegate(ownerAddress, '');
				message.success("Authorization succeeded!");
				window.parent.db3Callback(true);
			}
			return result;
		} catch (error) {
			console.error(error);
		}
	}, [delegateAddress, ownerAddress]);
	return (
		<div className='authorizaton'>
			<Steps labelPlacement='vertical'>
				<Step
					status='finish'
					description={
						<Tooltip title={ownerAddress}>
							<Paragraph ellipsis>{ownerAddress}</Paragraph>
						</Tooltip>
					}
					icon={<UserOutlined />}
				/>
				<Step status='finish' title='Authorize' />
				<Step
					status='finish'
					description={
						<Tooltip title={delegateAddress}>
							<Paragraph ellipsis>{delegateAddress}</Paragraph>
						</Tooltip>
					}
					icon={<UserOutlined />}
				/>
			</Steps>
			<div className='agreement'>
				<p style={{ textAlign: "left" }}>
					Next. a StepnPlus namespace will be created to write and
					read your geolocation information stored in our private
					database.
				</p>
				<div className='authorize-graph'>
					<div style={{ textAlign: "left", width: 330 }}>
						<SyntaxHighlighter language='sql' style={docco}>
							{sqlCode}
						</SyntaxHighlighter>
					</div>
					<div className='authorize-graph'>
						<Space align='start' size='large'>
							<Tree
								showIcon
								defaultExpandAll
								treeData={treeData}
							/>
							<div className='delegage-account'>
								<UserOutlined />
								Delegate Account: {delegateAddress}
							</div>
						</Space>
					</div>
				</div>
				<Space>
					Permission type:{" "}
					<Radio value={true} onChange={() => setAccess(true)}>
						Read and Write
					</Radio>
					<div>
						You can remove app access to your data at any time.
					</div>
				</Space>
			</div>
			<div className='btn-container'>
				<Button
					type='primary'
					className='allow-btn'
					disabled={!access}
					loading={allowAccessState.loading}
					onClick={allowAccess}
				>
					Yes, allow this application access
				</Button>
				<Button>Cancel</Button>
			</div>
			<p>Authorizina will redirect to http://demo.db3.network/</p>
		</div>
	);
});
export default Authorization;

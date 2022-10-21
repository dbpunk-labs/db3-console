import React, { memo, useState } from "react";
import { keyring } from "@polkadot/ui-keyring";
import Editor from "@monaco-editor/react";
import {
	Button,
	Collapse,
	Table,
	Popconfirm,
	message,
	Card,
	Spin,
	Select,
	Space,
} from "antd";
import { BarsOutlined } from "@ant-design/icons";
import { useAsyncFn } from "react-use";
import _ from "lodash";
import { useParams } from "react-router-dom";
import * as db3 from "../db3";
import { useRecoilValue, useRecoilRefresher_UNSTABLE } from "recoil";
import { delegatesSelector } from "../state";

const { Panel } = Collapse;
const { Column } = Table;
const { Option } = Select;

const SQLEditor: React.FC<any> = memo((props) => {
	const { ownerAddress } = useParams();
	const delegates = useRecoilValue(delegatesSelector(ownerAddress));
	const tableData = delegates?.map((item) => ({
		address: item[0],
		appName: item[1],
		access: item[2],
	}));
	const [namsepace, setNamespace] = useState();
	const [sql, setSQL] = useState<string>();
	const [sqlState, exec] = useAsyncFn(
		async (sql: string) => {
			try {
				return await db3.runSqlByOwner(sql, namsepace).then((data) => {
					if (data.status === 0) {
						return data.data;
					} else {
						message.error(data.msg);
					}
				});
			} catch (error) {
				console.error(error);
			}
		},
		[ownerAddress],
	);
	function onClick() {
		sql && exec(sql);
	}

	const refreshDelegates = useRecoilRefresher_UNSTABLE(
		delegatesSelector(ownerAddress),
	);
	const [deleteDelegateState, deleteDelegate] = useAsyncFn(
		(address: string) => {
			return db3
				.deleteDelegate(address, keyring.getPair(ownerAddress))
				.then(() => {
					message.success("Delete succeeded!");
					refreshDelegates();
				});
		},
		[refreshDelegates],
	);
	return (
		<div className='sql-editor'>
			<Collapse>
				<Panel header='Authorzie list'>
					<Spin spinning={deleteDelegateState.loading}>
						<Table
							rowKey='appName'
							dataSource={tableData}
							pagination={false}
						>
							<Column title='APP' dataIndex='appName' />
							<Column
								title='Access'
								dataIndex='access'
								render={(type) => {
									if (type === 1) {
										return "Read and write";
									} else {
										return "Read";
									}
								}}
							/>
							<Column
								dataIndex='address'
								render={(address) => (
									<Popconfirm
										title='Are you sure to delete this authorization?'
										onConfirm={() =>
											deleteDelegate(address)
										}
									>
										<Button type='link'>delete</Button>
									</Popconfirm>
								)}
							/>
						</Table>
					</Spin>
				</Panel>
				<Panel header='SQL editor' key='1'>
					<Space>
						<Select
							style={{ width: 150 }}
							value={namsepace}
							onChange={(value) => setNamespace(value)}
						>
							<Option value='StepnPlus'>StepnPlus</Option>
							<Option value='my_detwitter'>my_detwitter</Option>
						</Select>
						<Button
							style={{ marginBottom: 7 }}
							type='primary'
							onClick={onClick}
							loading={sqlState.loading}
						>
							RUN
						</Button>
					</Space>

					<Editor
						theme='vs-dark'
						height='30vh'
						defaultLanguage='sql'
						value={sql}
						onChange={setSQL}
					/>
					<Card
						title={
							<>
								<BarsOutlined /> Output
							</>
						}
					>
						{sqlState.value && JSON.stringify(sqlState.value)}
					</Card>
				</Panel>
			</Collapse>
		</div>
	);
});
export default SQLEditor;

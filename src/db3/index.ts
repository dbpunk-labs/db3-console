// @ts-nocheck
import { ApiPromise, WsProvider } from "@polkadot/api";
import {
	web3Accounts,
	web3Enable,
	web3FromSource,
} from "@polkadot/extension-dapp";
import { keyring as Keyring } from "@polkadot/ui-keyring";
import jsonrpc from "@polkadot/types/interfaces/jsonrpc";
import { isTestChain } from "@polkadot/util";
import { TypeRegistry } from "@polkadot/types/create";
import { v4 as uuid } from "uuid";
import PubSub from "pubsub-js";

interface Options {
	appName: string;
	node: string | string[];
	account?: string;
}

const registry = new TypeRegistry();

let apiPromise: Promise<any>;
export function init(options: Options) {
	const { appName, node, account } = options;
	if (!node) {
		throw Error("options.node is must");
	}
	const provider = new WsProvider(node);
	const _api = new ApiPromise({ provider, rpc: jsonrpc });
	apiPromise = new Promise((resolve, reject) => {
		_api.on("connected", () => {
			_api.isReady.then((api) => {
				listenEvent(api);
				resolve(api);
			});
		});
	});
	return apiPromise;
}

const retrieveChainInfo = async (api: any) => {
	const [systemChain, systemChainType] = await Promise.all([
		api.rpc.system.chain(),
		api.rpc.system.chainType
			? api.rpc.system.chainType()
			: Promise.resolve(registry.createType("ChainType", "Live")),
	]);

	return {
		systemChain: (systemChain || "<unknown>").toString(),
		systemChainType,
	};
};

export async function loadAccounts(appName: string) {
	console.log("load account");
	async function getAccounts(api: any) {
		await web3Enable(appName);
		let allAccounts = await web3Accounts();
		allAccounts = allAccounts.map(({ address, meta }) => ({
			address,
			meta: { ...meta, name: `${meta.name} (${meta.source})` },
		}));
		const { systemChain, systemChainType } = await retrieveChainInfo(api);
		const isDevelopment =
			systemChainType.isDevelopment ||
			systemChainType.isLocal ||
			isTestChain(systemChain);

		Keyring.loadAll({ isDevelopment }, allAccounts);
		const keyringOptions = Keyring.getPairs().map((account) => ({
			key: account.address,
			value: account.address,
			label: account.meta.name.toUpperCase(),
		}));
		return keyringOptions;
	}

	return new Promise(async (resolve, reject) => {
		function loopApi() {
			if (!apiPromise) {
				setTimeout(loopApi, 0);
			} else {
				apiPromise.then((api) => {
					getAccounts(api).then((data) => {
						resolve(data);
					});
				});
			}
		}
		loopApi();
	});
}

let currentAccount: any;
export function setCurrentAccount(account: any) {
	currentAccount = account;
}
const utils = {
	paramConversion: {
		num: [
			"Compact<Balance>",
			"BalanceOf",
			"u8",
			"u16",
			"u32",
			"u64",
			"u128",
			"i8",
			"i16",
			"i32",
			"i64",
			"i128",
		],
	},
};

const isNumType = (type) =>
	utils.paramConversion.num.some((el) => type.indexOf(el) >= 0);
const transformParams = (
	paramFields,
	inputParams,
	opts = { emptyAsNull: true },
) => {
	// if `opts.emptyAsNull` is true, empty param value will be added to res as `null`.
	//   Otherwise, it will not be added
	const paramVal = inputParams.map((inputParam) => {
		// To cater the js quirk that `null` is a type of `object`.
		if (
			typeof inputParam === "object" &&
			inputParam !== null &&
			typeof inputParam.value === "string"
		) {
			return inputParam.value.trim();
		} else if (typeof inputParam === "string") {
			return inputParam.trim();
		}
		return inputParam;
	});
	const params = paramFields.map((field, ind) => ({
		...field,
		value: paramVal[ind] || null,
	}));

	return params.reduce((memo, { type = "string", value }) => {
		if (value == null || value === "")
			return opts.emptyAsNull ? [...memo, null] : memo;

		let converted = value;

		// Deal with a vector
		if (type.indexOf("Vec<") >= 0) {
			converted = converted.split(",").map((e) => e.trim());
			converted = converted.map((single) =>
				isNumType(type)
					? single.indexOf(".") >= 0
						? Number.parseFloat(single)
						: Number.parseInt(single)
					: single,
			);
			return [...memo, converted];
		}

		// Deal with a single value
		if (isNumType(type)) {
			converted =
				converted.indexOf(".") >= 0
					? Number.parseFloat(converted)
					: Number.parseInt(converted);
		}
		return [...memo, converted];
	}, []);
};

const getFromAcct = async (account) => {
	const {
		address,
		meta: { source, isInjected },
	} = account;

	if (!isInjected) {
		return [account];
	}

	const injector = await web3FromSource(source);
	return [address, { signer: injector.signer }];
};
const palletRpc = "sqldb";

interface ParamField {
	name: string;
	optional: boolean;
	type: "Bytes";
}

interface InputParam {
	type: "Bytes";
	value: string;
}

async function singed(
	callable: string,
	paramFields: ParamField[],
	inputParams: InputParam[],
	account: any = currentAccount,
) {
	const api = await apiPromise;
	const fromAcct = await getFromAcct(account);
	const reqIdIndex = paramFields.findIndex((item) => item.name === "reqId");
	const reqId = inputParams[reqIdIndex]["value"];
	const transformed = transformParams(paramFields, inputParams);
	const txExecute = transformed
		? api.tx[palletRpc][callable](...transformed)
		: api.tx[palletRpc][callable]();
	await txExecute
		.signAndSend(...fromAcct, ({ status }) => {
			console.log(status);
		})
		.catch((error) => {
			console.error(error);
		});
	return new Promise((resolve, reject) => {
		function execSub(msg, data) {
			PubSub.unsubscribe(execSub);
			if (data.status === "1") {
				reject(data.msg);
			} else {
				resolve(data);
			}
		}
		PubSub.subscribe(reqId, execSub);
	});
}

export async function exec(sql: string) {
	const api = await apiPromise;
	const fromAcct = await getFromAcct();
	const reqId = uuid();
	const paramFields = [
		{
			name: "data",
			optional: false,
			type: "Bytes",
		},
		{
			name: "reqId",
			optional: false,
			type: "Bytes",
		},
	];
	const inputParams = [
		{
			type: "Bytes",
			value: sql,
		},
		{
			type: "Bytes",
			value: reqId,
		},
	];
	const callable = "runSqlByOwner";

	const transformed = transformParams(paramFields, inputParams);
	// transformed can be empty parameters
	const txExecute = transformed
		? api.tx[palletRpc][callable](...transformed)
		: api.tx[palletRpc][callable]();

	const unsub = txExecute
		.signAndSend(...fromAcct, ({ status }) => {
			console.log(status);
		})
		.catch((error) => {
			console.error(error);
		});
	return new Promise((resolve, reject) => {
		function execSub(msg, data) {
			PubSub.unsubscribe(execSub);
			if (data.status === "1") {
				reject(data.msg);
			} else {
				resolve(data);
			}
		}
		PubSub.subscribe(reqId, execSub);
	});
}

export async function createNS(appName: string) {
	const reqId = uuid();
	const paramFields = [
		{
			name: "ns",
			optional: false,
			type: "Bytes",
		},
		{
			name: "reqId",
			optional: false,
			type: "Bytes",
		},
	];
	const inputParams = [
		{
			type: "Bytes",
			value: appName,
		},
		{
			type: "Bytes",
			value: reqId,
		},
	];
	return singed("createNs", paramFields, inputParams);
}

export async function addDelegate(
	delegateAddress: string,
	ns: string,
	delegateType: number,
) {
	return singed("addDelegate", paramFields, inputParams);
}

export async function createNsAndAddDelegate(
	delegateAddress: string,
	ns: string,
) {
	const reqId = uuid();
	const paramFields = [
		{
			name: "delegate",
			optional: false,
			type: "MultiAddress",
		},
		{
			name: "ns",
			optional: false,
			type: "Bytes",
		},
		{
			name: "delegateType",
			optional: false,
			type: "u8",
		},
		{
			name: "reqId",
			optional: false,
			type: "Bytes",
		},
	];
	const inputParams = [
		{
			type: "MultiAddress",
			value: delegateAddress,
		},
		{
			type: "Bytes",
			value: ns,
		},
		{
			type: "u8",
			value: "1",
		},
		{
			type: "Bytes",
			value: reqId,
		},
	];
	return singed("createNsAndAddDelegate", paramFields, inputParams);
}

export async function deleteDelegate(
	delegateAddress: string,
	account: string,
	ns: string = "StepnPlus",
) {
	const reqId = uuid();
	const paramFields = [
		{
			name: "delegate",
			optional: false,
			type: "MultiAddress",
		},
		{
			name: "ns",
			optional: false,
			type: "Bytes",
		},
		{
			name: "reqId",
			optional: false,
			type: "Bytes",
		},
	];
	const inputParams = [
		{
			type: "MultiAddress",
			value: delegateAddress,
		},
		{
			type: "Bytes",
			value: ns,
		},
		{
			type: "Bytes",
			value: reqId,
		},
	];
	return singed("deleteDelegate", paramFields, inputParams, account);
}

export async function runSqlByOwner(
	sql: string,
	account: any,
	ns: string = "StepnPlus",
) {
	const reqId = uuid();
	const paramFields = [
		{
			name: "data",
			optional: false,
			type: "Bytes",
		},
		{
			name: "reqId",
			optional: false,
			type: "Bytes",
		},
		{
			name: "ns",
			optional: false,
			type: "Bytes",
		},
	];
	const inputParams = [
		{
			type: "Bytes",
			value: sql,
		},
		{
			type: "Bytes",
			value: reqId,
		},
		{
			type: "Bytes",
			value: ns,
		},
	];
	return singed("runSqlByOwner", paramFields, inputParams, account);
}

export async function runSqlByDelegate(
	ownerAddress: string,
	sql: string,
	account: any,
	ns: string = "StepnPlus",
) {
	const reqId = uuid();
	const paramFields = [
		{
			name: "owner",
			optional: false,
			type: "MultiAddress",
		},
		{
			name: "data",
			optional: false,
			type: "Bytes",
		},
		{
			name: "reqId",
			optional: false,
			type: "Bytes",
		},
		{
			name: "ns",
			optional: false,
			type: "Bytes",
		},
	];
	const inputParams = [
		{
			type: "MultiAddress",
			value: ownerAddress,
		},
		{
			type: "Bytes",
			value: sql,
		},
		{
			type: "Bytes",
			value: reqId,
		},
		{
			type: "Bytes",
			value: ns,
		},
	];
	return singed("runSqlByDelegate", paramFields, inputParams, account);
}

const eventName = (ev) => `${ev.section}:${ev.method}`;
const eventParams = (ev) => JSON.stringify(ev.data);

function listenEvent(api: any) {
	api.query.system.events((events) => {
		events.forEach((record) => {
			const { event, phase } = record;
			const evHuman = event.toHuman();
			const evName = eventName(evHuman);
			const evParams = eventParams(evHuman);
			console.log(evName, evParams);
			if (
				evName === "sqldb:SQLResult" ||
				evName === "sqldb:GeneralResultEvent"
			) {
				try {
					const content = JSON.parse(evParams)[0];
					const { req_id, data, status, msg } = JSON.parse(content);
					PubSub.publish(req_id, { data, status, msg });
				} catch (error) {
					console.error(`sqlResult: ${evParams}`);
				}
			}
		});
	});
}

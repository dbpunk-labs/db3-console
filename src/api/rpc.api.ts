import axios from "axios";
import { message } from "antd";

export interface ApiResponse<T> {
	status: "0" | "1";
	data: T;
}

const instance = axios.create({
	baseURL: import.meta.env.VITE_RPC_API,
});

instance.interceptors.response.use(
	(response) => {
		const { result, error, id } = response.data;
		if (error) {
			message.error(`code：${error}`);
			return Promise.reject(error);
		}
		return { result, id };
	},
	(error) => {
		console.error(error);
		const errorMsg = error?.response?.data?.msg || error.toString();
		message.error(errorMsg);
		return Promise.reject(error);
	},
);

export default (method: string, params: any) => {
	return instance.post("/", { jsonrpc: "2.0", id: null, method, params });
};

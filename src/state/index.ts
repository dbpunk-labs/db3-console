// @ts-nocheck
import { atom, selector, selectorFamily } from "recoil";
import _ from "lodash";
import rpc from "../api/rpc.api";

export const delegateAddressAtom = atom<string | null>({
	key: "delegateAddressAtom",
	default: null,
});

export const ownerAddressAtom = atom<string>({
	key: "ownerAddressAtom",
	default: selector({
		key: "ownerAddressAtom/default",
		get: () => {
			return localStorage.getItem("dtwitter_owner_address");
		},
	}),
	effects: [
		({ onSet }) => {
			onSet((value) => {
				localStorage.setItem("dtwitter_owner_address", value);
			});
		},
	],
});

export const delegatesSelector = selectorFamily({
	key: "delegatesSelector",
	get:
		(account) =>
		async ({ get }) => {
			if (account) {
				const { result } = await rpc("list_delegates", [account]);
				return result;
			}
		},
});

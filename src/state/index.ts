import { atom, selector, selectorFamily } from "recoil";
import _ from "lodash";
import rpc from "../api/rpc.api";

export const delegateAddressAtom = atom<string | null>({
	key: "delegateAddressAtom",
	default: null,
});

export const ownerAddressAtom = atom({
	key: "ownerAddressAtom",
	default: null,
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

"use client";
import { parseAsString, useQueryState } from "nuqs"

export const InputRedirect = () => {
	const [redirectTo] = useQueryState('redirectTo', parseAsString)

	return redirectTo && <input
		type="hidden"
		name="redirectTo"
		value={redirectTo}
	/>
}
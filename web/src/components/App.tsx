import { debugData } from "../utils/debugData";
import { VisibilityProvider } from "../providers/VisibilityProvider";
import DataHandler from "../DataHandler";
import ShopInterface from "./ShopInterface";
import { ShopItem } from "../types/ShopItem";

export default function App() {
	DataHandler();

	return (
		<VisibilityProvider>
			<div className="flex h-screen w-screen items-center justify-center">
				<div className="h-[82vh] w-3/4 bg-background/[0.97] p-4 transition-all">
					<ShopInterface />
				</div>
			</div>
		</VisibilityProvider>
	);
}

// Debug-Daten nur in Entwicklungsumgebung aktivieren
if (import.meta.env.DEV) {
	debugData([
		{
			action: "setVisible",
			data: true,
		},
	]);

	debugData([
		{
			action: "setCurrentShop",
			data: {
				shop: "247supermarket",
				label: "24/7 Supermarket",
				location: 1,
			},
		},
	]);

	debugData([
		{
			action: "setSelfData",
			data: {
				money: {
					Cash: 50.89,
					Bank: 200001.32,
				},
				weight: 1400,
				maxWeight: 14000,
				licenses: {
					weapon: true,
				},
			},
		},
	]);
}

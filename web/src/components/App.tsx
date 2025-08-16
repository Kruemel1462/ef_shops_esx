import { debugData } from "../utils/debugData";
import { VisibilityProvider } from "../providers/VisibilityProvider";
import DataHandler from "../DataHandler";
import ShopInterface from "./ShopInterface";
import { ShopItem } from "../types/ShopItem";

export default function App() {
	DataHandler();

	return (
		<VisibilityProvider>
			<div className="flex h-screen w-screen items-center justify-center p-4">
				<div className="h-full max-h-[90vh] w-full max-w-[95vw] bg-background/[0.98] backdrop-blur-sm p-6 transition-all duration-500 ease-in-out hover:shadow-2xl hover:shadow-purple-500/20 rounded-xl border border-purple-500/20 shadow-lg shadow-purple-500/10">
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

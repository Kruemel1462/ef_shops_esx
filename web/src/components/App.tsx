import { debugData } from "../utils/debugData";
import { VisibilityProvider } from "../providers/VisibilityProvider";
import DataHandler from "../DataHandler";
import ShopInterface from "./ShopInterface";
import { ShopItem } from "../types/ShopItem";

export default function App() {
	DataHandler();

	return (
		<VisibilityProvider>
			<div className="flex min-h-screen w-screen items-center justify-center p-4 bg-gradient-to-br from-background/95 via-background/90 to-background/95">
				<div className="h-[90vh] w-full max-w-7xl bg-gradient-to-br from-card/40 via-card/30 to-card/20 backdrop-blur-xl border border-border/30 rounded-2xl shadow-2xl shadow-primary/5 p-6 transition-all duration-500 hover:shadow-primary/10">
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
